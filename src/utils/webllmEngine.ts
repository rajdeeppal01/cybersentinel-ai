import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { LogAnalysisResult, PhishingAnalysisResult, PolicyAuditResult } from "./aiEngine";

let currentModelId = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";

let enginePromise: Promise<MLCEngine> | null = null;

export type LoadProgress = { text: string; progress: number };

/**
 * Loads (or returns the already-loading) WebLLM engine.
 * Safe to call multiple times -- it will only download/init once.
 */
export function getEngine(onProgress?: (p: LoadProgress) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(currentModelId, {
      initProgressCallback: (report) => {
        onProgress?.({ text: report.text, progress: report.progress });
      },
    });
  }
  return enginePromise;
}

/**
 * Requests permanent storage, changes model to Phi-3, and reloads the engine.
 */
export async function upgradeEngineToPhi3(onProgress?: (p: LoadProgress) => void): Promise<MLCEngine> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      await navigator.storage.persist();
    } catch (err) {
      console.warn("Storage persist request failed or denied:", err);
    }
  }
  
  currentModelId = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
  enginePromise = null; // Clear old engine
  return getEngine(onProgress);
}

const SYSTEM_PROMPT = `You are a security log analysis engine. You will be given a raw log snippet.
Respond with ONLY a single JSON object (no markdown, no backticks, no preamble) matching exactly this shape:

{
  "detectedThreat": string,
  "confidence": number (0-100),
  "severity": "low" | "medium" | "high" | "critical",
  "mitreCode": string,
  "mitreName": string,
  "mitreDescription": string,
  "grcControls": { "nist": string, "soc2": string, "iso27001": string, "gdpr": string },
  "analysisSummary": string,
  "impact": string,
  "incidentResponsePlaybook": string[],
  "needsEscalation": boolean
}

Set "needsEscalation" to true if you are not confident in your classification (e.g. confidence below 70,
ambiguous log content, or a threat type outside common categories like SQLi/brute-force/RCE/ransomware/phishing).
If the log shows no clear threat, say so honestly with a low confidence score rather than inventing one.`;

// Known-good MITRE codes for common threat categories our engine is designed to catch.
// If the model claims one of these categories but returns a mismatched code,
// that's a strong signal it hallucinated the mapping -- flag for escalation
// even if the model itself reported high confidence.
const MITRE_SANITY_MAP: { keywords: string[]; expectedCode: string }[] = [
  { keywords: ['sql injection', 'sqli', 'union select'], expectedCode: 'T1190' },
  { keywords: ['ssh', 'brute force', 'brute-force', 'password guess'], expectedCode: 'T1110' },
  { keywords: ['log4shell', 'log4j', 'jndi'], expectedCode: 'T1210' },
  { keywords: ['ransomware', 'encryption', 'vssadmin'], expectedCode: 'T1486' },
];

const VALID_MITRE_FORMAT = /^T\d{4}(\.\d{3})?$/;

function mitreCodeLooksTrustworthy(detectedThreat: string, mitreCode: string): boolean {
  if (!VALID_MITRE_FORMAT.test(mitreCode)) return false;

  const normalizedThreat = detectedThreat.toLowerCase();
  const matchedCategory = MITRE_SANITY_MAP.find((entry) =>
    entry.keywords.some((kw) => normalizedThreat.includes(kw))
  );

  if (!matchedCategory) return true; // no known category to check against, give benefit of the doubt
  return mitreCode.startsWith(matchedCategory.expectedCode);
}

export async function analyzeLogWithLLM(
  logText: string,
  onProgress?: (p: LoadProgress) => void
): Promise<LogAnalysisResult & { needsEscalation: boolean }> {
  const engine = await getEngine(onProgress);

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: logText },
    ],
    temperature: 0.2,
  });

  const raw = reply.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed: LogAnalysisResult & { needsEscalation: boolean };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("LLM returned non-JSON output, fall back to local engine");
  }

  // Independent sanity check -- don't just trust the model's self-reported confidence.
  if (!mitreCodeLooksTrustworthy(parsed.detectedThreat, parsed.mitreCode)) {
    parsed.needsEscalation = true;
  }

  return parsed;
}

const PHISHING_SYSTEM_PROMPT = `You are an email phishing detection engine. You will be given a raw email (headers + body).
Respond with ONLY a single JSON object (no markdown, no backticks, no preamble) matching exactly this shape:

{
  "riskScore": number (0-100),
  "verdict": "Safe" | "Suspicious" | "Malicious",
  "threats": [
    { "category": string, "description": string, "snippet": string }
  ],
  "needsEscalation": boolean
}

"threats" should be an empty array if the email is safe. Each "snippet" should be a short exact quote from
the email body that supports that specific threat category (e.g. a suspicious link, urgency language, a
spoofed sender domain).

Set "needsEscalation" to true if you're not confident in your verdict, or the email has unusual characteristics
that don't clearly fit typical phishing/safe patterns.`;

export async function analyzeEmailWithLLM(
  emailText: string,
  onProgress?: (p: LoadProgress) => void
): Promise<PhishingAnalysisResult & { needsEscalation: boolean }> {
  const engine = await getEngine(onProgress);

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: PHISHING_SYSTEM_PROMPT },
      { role: "user", content: emailText },
    ],
    temperature: 0.2,
  });

  const raw = reply.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("LLM returned non-JSON output, fall back to local engine");
  }
}

const POLICY_SYSTEM_PROMPT = `You are a GRC compliance auditor reviewing a security policy draft against a named framework.
Respond with ONLY a single JSON object (no markdown, no backticks, no preamble) matching exactly this shape:

{
  "overallScore": number (0-100),
  "status": "Compliant" | "Partial" | "Non-Compliant",
  "gaps": [
    {
      "controlId": string,
      "title": string,
      "description": string,
      "severity": "high" | "medium" | "low",
      "finding": string,
      "suggestedWording": string
    }
  ],
  "summary": string,
  "needsEscalation": boolean
}

"gaps" should be an empty array if the policy is fully compliant. Base findings only on what's actually
present or missing in the given policy text, for the specifically named framework.

Set "needsEscalation" to true if you're not fully confident in this audit, or the framework/policy
combination is unusual or ambiguous.`;

export async function analyzePolicyWithLLM(
  policyText: string,
  framework: string,
  onProgress?: (p: LoadProgress) => void
): Promise<PolicyAuditResult & { needsEscalation: boolean }> {
  const engine = await getEngine(onProgress);

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: POLICY_SYSTEM_PROMPT },
      { role: "user", content: `FRAMEWORK: ${framework}\n\nPOLICY TEXT:\n${policyText}` },
    ],
    temperature: 0.2,
  });

  const raw = reply.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    parsed.framework = framework;
    return parsed;
  } catch {
    throw new Error("LLM returned non-JSON output, fall back to local engine");
  }
}