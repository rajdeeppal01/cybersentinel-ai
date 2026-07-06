import { LogAnalysisResult } from "./aiEngine";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a senior security analyst providing a second-opinion review of a security log.
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
  "incidentResponsePlaybook": string[]
}

Be precise about MITRE ATT&CK codes -- do not guess if unsure, use the closest well-known technique ID.
If the log shows no clear threat, say so honestly with a low confidence score rather than inventing one.`;

export class OnlineEngineError extends Error {}

/**
 * Sends the log directly from the browser to Google's Gemini API using the
 * visitor's own API key. The key never touches any server we control --
 * it goes straight from their browser to Google.
 */
export async function analyzeLogWithGemini(
  logText: string,
  apiKey: string
): Promise<LogAnalysisResult> {
  if (!apiKey.trim()) {
    throw new OnlineEngineError("No API key provided.");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${SYSTEM_PROMPT}\n\nLOG TO ANALYZE:\n${logText}` }],
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