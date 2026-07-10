import { LogAnalysisResult, PhishingAnalysisResult, PolicyAuditResult } from "./aiEngine";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export class OnlineEngineError extends Error {}

/**
 * Sends the log directly from the browser to Google's Gemini API using the
 * visitor's own API key. The key never touches any server we control --
 * it goes straight from their browser to Google.
 */
export async function analyzeLogWithGemini(
  logText: string
): Promise<LogAnalysisResult> {
  // We no longer hit Gemini directly from the browser!
  // We now hit our own FastAPI Vercel Serverless backend.
  
  const response = await fetch(`/api/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alert_id: "ALT-FRONTEND-" + Math.floor(Math.random() * 1000),
      raw_log: logText,
      source_ip: "Client"
    }),
  });

  if (!response.ok) {
    throw new OnlineEngineError(`Backend API failed (status ${response.status}). Check Vercel logs or API key.`);
  }

  const data = await response.json();
  return data;
}

export async function analyzePhishingWithBackend(
  emailText: string
): Promise<PhishingAnalysisResult> {
  const response = await fetch(`/api/phishing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email_text: emailText
    }),
  });

  if (!response.ok) {
    throw new OnlineEngineError(`Backend API failed (status ${response.status}).`);
  }

  const data = await response.json();
  return data;
}

const PHISHING_SYSTEM_PROMPT = `You are a senior security analyst providing a second-opinion review of a suspicious email.
Respond with ONLY a single JSON object (no markdown, no backticks, no preamble) matching exactly this shape:

{
  "riskScore": number (0-100),
  "verdict": "Safe" | "Suspicious" | "Malicious",
  "threats": [
    { "category": string, "description": string, "snippet": string }
  ]
}

"threats" should be an empty array if the email is safe. Each "snippet" should be a short exact quote from
the email that supports that specific threat category.`;

export async function analyzeEmailWithGemini(
  emailText: string,
  apiKey: string
): Promise<PhishingAnalysisResult> {
  if (!apiKey.trim()) {
    throw new OnlineEngineError("No API key provided.");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${PHISHING_SYSTEM_PROMPT}\n\nEMAIL TO ANALYZE:\n${emailText}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new OnlineEngineError("That API key looks invalid or lacks permission.");
    }
    if (response.status === 429) {
      throw new OnlineEngineError("Rate limit hit on this API key. Try again shortly.");
    }
    throw new OnlineEngineError(`Gemini request failed (status ${response.status}).`);
  }

  const data = await response.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new OnlineEngineError("Gemini returned a response we couldn't parse.");
  }
}

const POLICY_SYSTEM_PROMPT = `You are a senior GRC auditor providing a second-opinion review of a security policy
draft against a named compliance framework.
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
  "summary": string
}

"gaps" should be an empty array if fully compliant. Base findings only on what's actually present or
missing in the given policy text.`;

export async function analyzePolicyWithGemini(
  policyText: string,
  framework: string,
  apiKey: string
): Promise<PolicyAuditResult> {
  if (!apiKey.trim()) {
    throw new OnlineEngineError("No API key provided.");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${POLICY_SYSTEM_PROMPT}\n\nFRAMEWORK: ${framework}\n\nPOLICY TEXT:\n${policyText}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new OnlineEngineError("That API key looks invalid or lacks permission.");
    }
    if (response.status === 429) {
      throw new OnlineEngineError("Rate limit hit on this API key. Try again shortly.");
    }
    throw new OnlineEngineError(`Gemini request failed (status ${response.status}).`);
  }

  const data = await response.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    parsed.framework = framework;
    return parsed;
  } catch {
    throw new OnlineEngineError("Gemini returned a response we couldn't parse.");
  }
}