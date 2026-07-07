// Lightweight email header & URL forensics -- inspired by common SOC Tier-1
// triage techniques (sender/reply-to mismatch, suspicious TLDs, shorteners,
// dangerous attachment extensions). Independently written; no code copied
// from any third-party tool.

export interface EmailForensicsResult {
  senderDomain: string | null;
  replyToDomain: string | null;
  domainMismatch: boolean;
  subjectAllCaps: boolean;
  exclamationCount: number;
  suspiciousKeywordsFound: string[];
  urls: string[];
  urlShortenerFound: boolean;
  insecureHttpFound: boolean;
  suspiciousTldFound: boolean;
  dangerousAttachmentMentioned: string | null;
  missingMessageId: boolean;
  forensicScore: number; // 0-100, additive signal separate from the AI verdict
  flags: string[]; // human-readable list of everything that fired
}

const SUSPICIOUS_SUBJECT_KEYWORDS = [
  'urgent', 'immediately', 'suspended', 'verify', 'security alert',
  'action required', 'account compromised', 'invoice attached',
  'confirm', 'click here', 'login', 'password', 'update payment',
];

const URL_SHORTENERS = ['t.ly', 'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd'];
const SUSPICIOUS_TLDS = ['.ru', '.xyz', '.top', '.tk', '.pw', '.cc', '.info'];
const DANGEROUS_EXTENSIONS = ['.exe', '.zip', '.js', '.docm', '.bat', '.ps1', '.vbs', '.scr'];

function extractHeaderField(rawEmail: string, fieldName: string): string | null {
  const regex = new RegExp(`^${fieldName}\\s*:\\s*(.+)$`, 'im');
  const match = rawEmail.match(regex);
  return match ? match[1].trim() : null;
}

function extractDomain(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const emailMatch = headerValue.match(/[\w.+-]+@([\w.-]+)/);
  return emailMatch ? emailMatch[1].toLowerCase() : null;
}

export function analyzeEmailForensics(rawEmail: string): EmailForensicsResult {
  const flags: string[] = [];
  let score = 0;

  const fromField = extractHeaderField(rawEmail, 'From');
  const replyToField = extractHeaderField(rawEmail, 'Reply-To');
  const subjectField = extractHeaderField(rawEmail, 'Subject') ?? '';
  const messageIdField = extractHeaderField(rawEmail, 'Message-ID');

  const senderDomain = extractDomain(fromField);
  const replyToDomain = extractDomain(replyToField);

  // Domain mismatch check
  let domainMismatch = false;
  if (senderDomain && replyToDomain && senderDomain !== replyToDomain) {
    domainMismatch = true;
    score += 15;
    flags.push(`Reply-To domain (${replyToDomain}) differs from From domain (${senderDomain})`);
  }

  // Keyword check
  const lowerSubject = subjectField.toLowerCase();
  const suspiciousKeywordsFound = SUSPICIOUS_SUBJECT_KEYWORDS.filter((kw) => lowerSubject.includes(kw));
  if (suspiciousKeywordsFound.length === 1) {
    score += 5;
    flags.push(`Subject contains a suspicious phrase: "${suspiciousKeywordsFound[0]}"`);
  } else if (suspiciousKeywordsFound.length > 1) {
    score += 10;
    flags.push(`Subject contains multiple suspicious phrases: ${suspiciousKeywordsFound.join(', ')}`);
  }

  // Subject formatting checks
  const subjectAllCaps = subjectField.length > 0 && subjectField === subjectField.toUpperCase();
  if (subjectAllCaps) {
    score += 5;
    flags.push('Subject line is entirely uppercase');
  }

  const exclamationCount = (subjectField.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    score += 5;
    flags.push(`Subject has ${exclamationCount} exclamation marks`);
  }

  // Dangerous attachment mention (text-based heuristic, since we only have pasted text, not a real .eml)
  let dangerousAttachmentMentioned: string | null = null;
  for (const ext of DANGEROUS_EXTENSIONS) {
    const attachRegex = new RegExp(`[\\w.-]+\\${ext}`, 'i');
    const match = rawEmail.match(attachRegex);
    if (match) {
      dangerousAttachmentMentioned = match[0];
      score += 25;
      flags.push(`Dangerous attachment type mentioned: ${match[0]}`);
      break;
    }
  }

  // URL extraction & feature checks
  const urls = Array.from(rawEmail.matchAll(/https?:\/\/[^\s"'<>]+/g)).map((m) => m[0]);
  const urlShortenerFound = urls.some((u) => URL_SHORTENERS.some((s) => u.includes(s)));
  const insecureHttpFound = urls.some((u) => u.startsWith('http://'));
  const suspiciousTldFound = urls.some((u) => SUSPICIOUS_TLDS.some((tld) => u.includes(tld)));

  if (urlShortenerFound) {
    score += 10;
    flags.push('URL shortener detected in email body');
  }
  if (insecureHttpFound) {
    score += 5;
    flags.push('Insecure (http://) link detected in email body');
  }
  if (suspiciousTldFound) {
    score += 10;
    flags.push('Suspicious top-level domain detected in a link');
  }

  // Missing Message-ID
  const missingMessageId = !messageIdField;
  if (missingMessageId) {
    score += 5;
    flags.push('No Message-ID header present');
  }

  return {
    senderDomain,
    replyToDomain,
    domainMismatch,
    subjectAllCaps,
    exclamationCount,
    suspiciousKeywordsFound,
    urls,
    urlShortenerFound,
    insecureHttpFound,
    suspiciousTldFound,
    dangerousAttachmentMentioned,
    missingMessageId,
    forensicScore: Math.min(score, 100),
    flags,
  };
}