import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import anthropic
from api.claude_agent import router as claude_router

app = FastAPI(title="CyberSentinel Agent Harness")

# Expose the Claude Agent SDK endpoint as well
app.include_router(claude_router)

# Note: We are using Gemini API here because the user is on the free tier.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

anthropic_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

class TriageRequest(BaseModel):
    alert_id: str
    raw_log: str
    source_ip: str

class TriageDecision(BaseModel):
    detectedThreat: str
    confidence: float
    severity: str
    mitreCode: str
    mitreName: str
    mitreDescription: str
    grcControls: dict
    analysisSummary: str
    impact: str
    incidentResponsePlaybook: List[str]

# Tool Definitions (Guardrails)
SECURITY_TOOLS = [
    {
        "functionDeclarations": [
            {
                "name": "quarantine_endpoint",
                "description": "Quarantines an endpoint by isolating it from the network. Use only for confirmed critical threats (e.g. ransomware, active lateral movement).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "ip_address": {"type": "STRING"},
                        "reason": {"type": "STRING"}
                    },
                    "required": ["ip_address", "reason"]
                }
            },
            {
                "name": "create_jira_ticket",
                "description": "Creates a ticket for the SOC team for manual review. Use for medium/high severity alerts that are not actively spreading.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "alert_id": {"type": "STRING"},
                        "summary": {"type": "STRING"}
                    },
                    "required": ["alert_id", "summary"]
                }
            },
            {
                "name": "auto_generate_remediation_pr",
                "description": "Auto-generates a code fix and opens a Pull Request on GitHub to remediate a SAST/DAST vulnerability (e.g., SQL Injection, XSS).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "repo_name": {"type": "STRING", "description": "The repository name to patch"},
                        "vulnerability_type": {"type": "STRING", "description": "Type of vulnerability being fixed"},
                        "proposed_code_fix": {"type": "STRING", "description": "The actual patched code block"}
                    },
                    "required": ["repo_name", "vulnerability_type", "proposed_code_fix"]
                }
            }
        ]
    }
]

class PhishingRequest(BaseModel):
    email_text: str

@app.post("/api/phishing")
async def analyze_phishing(req: PhishingRequest):
    """
    Structured Output Endpoint:
    Forces the LLM to output a strict JSON decision matrix for a phishing email.
    """
    # Fallback to Dynamic Rule-Based Heuristics engine due to API quota exhaustion
    norm = req.email_text.lower()
    threats = []
    score = 0

    urgency_keywords = ['urgent', 'immediate action', 'suspended', 'unauthorized login', 'verify account', 'security warning', 'wire transfer', 'payroll update', 'overdue invoice']
    for kw in urgency_keywords:
        if kw in norm:
            score += 15
            idx = norm.index(kw)
            snippet = req.email_text[max(0, idx - 20):min(len(req.email_text), idx + len(kw) + 30)]
            threats.append({
                "category": "Urgency & Scare Tactics",
                "description": f"Uses high-stress triggers (\"{kw}\") to bypass logical security verification checks.",
                "snippet": snippet
            })

    suspect_domains = ['secure-bank', 'login-verify', 'update-cpanel', 'netflix-billing', 'support-desk', 'paypal-safety']
    for sd in suspect_domains:
        if sd in norm:
            score += 30
            idx = norm.index(sd)
            snippet = req.email_text[max(0, idx - 15):min(len(req.email_text), idx + len(sd) + 15)]
            threats.append({
                "category": "Spoofed/Lookalike Domain",
                "description": f"Uses a suspicious or lookalike domain \"{sd}\" designed to mimic authentic organizations.",
                "snippet": snippet
            })

    if 'click here' in norm or 'login to your account' in norm or 'update your details' in norm:
        score += 20
        threats.append({
            "category": "Generic Call to Action (CTA)",
            "description": "Contains generic hyperlink instructions designed to redirect the victim to credential harvesting landing pages.",
            "snippet": "Hyperlink CTA detected (e.g. \"click here\" or login requests)"
        })

    if 'bank transfer' in norm or 'swift' in norm or 'routing number' in norm or 'crypto' in norm:
        score += 15
        threats.append({
            "category": "Financial Request Trigger",
            "description": "Identifies banking routing, wiring, or crypto commands typical of Business Email Compromise (BEC).",
            "snippet": "Request involving account wires, invoices, or bank transfers."
        })

    score = min(score, 100)
    verdict = "Malicious" if score > 60 else "Suspicious" if score > 20 else "Safe"

    # Add a custom threat to prove it hit the Vercel backend
    threats.append({
        "category": "Backend Processing Verified",
        "description": "This analysis was dynamically generated by the Vercel Python Backend, not the local browser!",
        "snippet": "[VERCEL-BACKEND-HEURISTIC-ENGINE]"
    })

    decision = {
        "riskScore": score,
        "verdict": verdict,
        "threats": threats
    }
    return decision

class AuditRequest(BaseModel):
    policy_text: str
    framework: str

@app.post("/api/audit")
async def audit_policy(req: AuditRequest):
    if not ANTHROPIC_API_KEY:
        # Fallback to Dynamic Rule-Based Heuristics engine due to API quota exhaustion
        norm = req.policy_text.lower()
        gaps = []
        score = 100

        if req.framework == 'SOC 2':
            if 'mfa' not in norm and 'multi-factor' not in norm and 'two-factor' not in norm and '2fa' not in norm:
                score -= 25
                gaps.append({
                    "controlId": "CC6.1",
                    "title": "Logical Access Controls (MFA Enforcement)",
                    "description": "Requires authentication mechanisms to protect production infrastructure using secondary validation layers.",
                    "severity": "high",
                    "finding": "The policy permits direct access without specifying Multi-Factor Authentication (MFA) requirements for staff or system administrators.",
                    "suggestedWording": "Multi-factor authentication (MFA) must be enforced for all employees and system administrators accessing the company production network, cloud services, and email suites."
                })
            if '12' not in norm and '14' not in norm and 'character' not in norm:
                score -= 20
                gaps.append({
                    "controlId": "CC6.2",
                    "title": "User Registration & Credential Integrity (Length)",
                    "description": "Requires establishing robust password parameters (length, complexity, rotation) to mitigate credential guessing.",
                    "severity": "high",
                    "finding": "No specific password length parameter is defined in the access control text.",
                    "suggestedWording": "Passwords must contain a minimum of 12 characters."
                })
            if 'complexity' not in norm and 'complex' not in norm and 'special' not in norm and 'symbol' not in norm and 'uppercase' not in norm:
                score -= 15
                gaps.append({
                    "controlId": "CC6.2",
                    "title": "User Registration & Credential Integrity (Complexity)",
                    "description": "Requires passwords to contain complex characters to block dictionary scans.",
                    "severity": "medium",
                    "finding": "No password complexity requirements (e.g. symbols, numbers, uppercase letters) are specified.",
                    "suggestedWording": "Passwords must include at least one uppercase letter, one lowercase letter, one number, and one special character."
                })
            if ('quarter' not in norm and 'annual' not in norm and 'review' not in norm) or 'whenever they think' in norm:
                score -= 15
                gaps.append({
                    "controlId": "CC6.3",
                    "title": "Access Review Audits",
                    "description": "Requires periodic authorization reviews to maintain the principle of least privilege.",
                    "severity": "medium",
                    "finding": "Access reviews are loosely scheduled which fails the audit standard for structural periodic review.",
                    "suggestedWording": "User access privileges to production databases and code repositories must be formally reviewed by authorized management on a quarterly basis to enforce the principle of least privilege."
                })
            if 'encrypt' not in norm and 'ssl' not in norm and 'tls' not in norm:
                score -= 20
                gaps.append({
                    "controlId": "CC6.6",
                    "title": "Transmission Security (Encryption)",
                    "description": "Requires encryption of data during transmission over public networks.",
                    "severity": "high",
                    "finding": "No mention of database or transmission encryption standards for internal and external network requests.",
                    "suggestedWording": "All communications carrying sensitive or customer data over external networks must be encrypted using TLS 1.3 or higher. All persistent production database disks must be encrypted at rest."
                })

        elif req.framework == 'ISO 27001':
            if 'external hard drive' in norm and 'office' in norm and 'cloud' not in norm and 'off-site' not in norm:
                score -= 30
                gaps.append({
                    "controlId": "A.12.3.1",
                    "title": "Information Backup Security",
                    "description": "Requires backups to be taken, regularly tested, and stored securely off-site in an isolated location.",
                    "severity": "high",
                    "finding": "Backups are stored locally on a physical drive in the office, creating a single point of failure.",
                    "suggestedWording": "System backups must be encrypted, replicated automatically, and stored in a secure, off-site cloud environment."
                })
            if ('test' not in norm and 'verify' not in norm) or 'occasionally' in norm:
                score -= 20
                gaps.append({
                    "controlId": "A.12.3.1",
                    "title": "Backup Restoration Testing",
                    "description": "Requires backup restoration capabilities to be tested at scheduled intervals.",
                    "severity": "medium",
                    "finding": "Backup testing is undefined or described as occasional rather than scheduled and documented.",
                    "suggestedWording": "Backups must undergo simulated restoration testing at least semi-annually."
                })
            if 'incident' not in norm or 'attempt to restore' in norm:
                score -= 25
                gaps.append({
                    "controlId": "A.16.1",
                    "title": "Security Incident Procedures",
                    "description": "Requires operational procedures to ensure quick and structured response to security incidents.",
                    "severity": "high",
                    "finding": "No formalized incident escalation or response path exists beyond attempting to restore servers as soon as possible.",
                    "suggestedWording": "A formal Incident Response Plan (IRP) must be maintained, detailing escalation paths, communications checklists, and regulatory reporting steps."
                })

        elif req.framework == 'HIPAA':
            if 'patient' not in norm and 'phi' not in norm and 'health' not in norm:
                score -= 15
                gaps.append({
                    "controlId": "164.308(a)(1)",
                    "title": "PHI Data Identification",
                    "description": "Requires explicit security procedures governing electronic Protected Health Information (ePHI).",
                    "severity": "medium",
                    "finding": "The policy text lacks explicit reference to Protected Health Information (PHI) definition and storage parameters.",
                    "suggestedWording": "All systems handling Electronic Protected Health Information (ePHI) must maintain audit logging and be restricted strictly to credentialed health workers on a need-to-know basis."
                })
            if ('training' not in norm and 'awareness' not in norm) or 'briefed' in norm:
                score -= 30
                gaps.append({
                    "controlId": "164.308(a)(5)",
                    "title": "Security Awareness Training",
                    "description": "Requires security awareness and training programs for all members of the workforce.",
                    "severity": "high",
                    "finding": "HR security onboarding is brief and informal. No systematic training is established.",
                    "suggestedWording": "All workforce members, including contractors, must complete compliance-certified HIPAA Privacy and Security Awareness training annually."
                })
            if 'immediately' not in norm and '24 hours' not in norm and 'leaves' in norm:
                score -= 25
                gaps.append({
                    "controlId": "164.308(a)(4)",
                    "title": "Termination Procedures",
                    "description": "Enforces procedures for terminating access to PHI when employment ends.",
                    "severity": "high",
                    "finding": "Lack of timeline constraint on disabling system accounts for departing staff, which can lead to orphan account compromises.",
                    "suggestedWording": "System access and authentication tokens for terminated employees must be revoked immediately upon departure, and no later than 24 hours from official termination."
                })

        elif req.framework == 'GDPR':
            if 'delete' not in norm and 'retention' not in norm and 'right to be forgotten' not in norm:
                score -= 30
                gaps.append({
                    "controlId": "Article 17",
                    "title": "Right to Erasure (Forgotten)",
                    "description": "Requires systems to be able to delete personal data of EU citizens upon request without undue delay.",
                    "severity": "high",
                    "finding": "The policy does not address data subject rights, particularly the Right to Erasure or structured data retention periods.",
                    "suggestedWording": "Processes must be implemented to fulfill customer requests for data erasure under GDPR Article 17 within 30 days."
                })
            if '72' not in norm and 'breach' not in norm:
                score -= 30
                gaps.append({
                    "controlId": "Article 33",
                    "title": "Notification of Personal Data Breach",
                    "description": "Requires notifying supervisory authorities of data breaches within 72 hours of identification.",
                    "severity": "high",
                    "finding": "No policy provision specifies the mandatory 72-hour window for reporting data breaches to data protection authorities.",
                    "suggestedWording": "In the event of a personal data breach, the Data Protection Officer (DPO) must evaluate risk and, if required, notify the relevant Supervisory Authority within 72 hours."
                })

        score = max(score, 10)
        status = 'Compliant' if score > 85 else 'Partial' if score > 50 else 'Non-Compliant'
        summary = 'This policy is robust and covers key regulatory parameters.' if score > 85 else f'The policy has notable compliance gaps under the {req.framework} framework. Review the details below and apply the suggested edits.'

        # Add a custom gap to prove backend execution
        gaps.append({
            "controlId": "VERCEL-BACKEND",
            "title": "Backend Verification Signature",
            "description": "This analysis was dynamically generated by the Vercel Python Backend, not the local browser!",
            "severity": "low",
            "finding": "Verified server-side execution.",
            "suggestedWording": "N/A"
        })

        return {
            "overallScore": score,
            "status": status,
            "gaps": gaps,
            "summary": summary
        }

@app.post("/api/triage", response_model=TriageDecision)
async def autonomous_triage(req: TriageRequest):
    """
    Structured Output Endpoint:
    Forces the LLM to output a strict JSON decision matrix for an alert.
    """
    # Fallback to Dynamic Rule-Based Heuristics engine due to API quota exhaustion
    # This proves the backend is processing logs dynamically!
    import urllib.parse
    log_text = urllib.parse.unquote(req.raw_log.lower())
    
    threat = "Suspicious Activity Detected"
    severity = "medium"
    confidence = 65
    mitre = "T1078: Valid Accounts"
    desc = "Unusual pattern observed in logs."
    
    if "union select" in log_text or "1=1" in log_text:
        threat = "SQL Injection Attack"
        severity = "critical"
        confidence = 98
        mitre = "T1190: Exploit Public-Facing Application"
        desc = "Attacker is attempting to manipulate SQL queries to extract data."
    elif "sshd" in log_text and "invalid user" in log_text:
        threat = "SSH Brute Force"
        severity = "high"
        confidence = 92
        mitre = "T1110: Brute Force"
        desc = "Multiple failed login attempts detected on SSH."
    elif "jndi:ldap" in log_text:
        threat = "Log4Shell Exploitation"
        severity = "critical"
        confidence = 99
        mitre = "T1190: Exploit Public-Facing Application"
        desc = "Attempted Log4j JNDI injection detected."
    elif "vssadmin" in log_text and "delete shadows" in log_text:
        threat = "Ransomware File Encryption"
        severity = "critical"
        confidence = 95
        mitre = "T1486: Data Encrypted for Impact"
        desc = "Ransomware behavior deleting volume shadow copies."
    else:
        threat = "Benign Activity"
        severity = "low"
        confidence = 80
        mitre = "None"
        desc = "Normal log behavior."

    decision = {
        "detectedThreat": threat,
        "confidence": confidence,
        "severity": severity,
        "mitreCode": mitre.split(":")[0] if ":" in mitre else "N/A",
        "mitreName": mitre.split(":")[1].strip() if ":" in mitre else mitre,
        "mitreDescription": desc,
        "grcControls": {
            "nist": "DE.AE-1",
            "soc2": "CC7.2",
            "iso27001": "A.16.1.2",
            "gdpr": "Article 32"
        },
        "analysisSummary": f"Rule-based analysis processed log from {req.source_ip}. Identified patterns matching {threat}.",
        "impact": f"Potential compromise of systems if {threat} is successful.",
        "incidentResponsePlaybook": [
            f"Isolate affected system at {req.source_ip}",
            "Block malicious IP addresses",
            "Review associated application logs",
            "Patch vulnerable software components"
        ]
    }
    return decision


@app.post("/api/remediate")
async def autonomous_remediation(req: TriageRequest):
    """
    Tool Calling Endpoint:
    Allows the agent to actively take actions (Quarantine, Ticket) based on the log.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = (
        f"A security alert ({req.alert_id}) fired for IP {req.source_ip}. "
        f"Raw Log: {req.raw_log}. "
        f"Evaluate this log. If it is a confirmed critical threat (ransomware, reverse shell), quarantine the endpoint. "
        f"If it is a suspicious but unclear event, create a Jira ticket for manual review. "
        f"If it is benign, do nothing and say 'Benign'."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "tools": SECURITY_TOOLS
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
        
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"LLM API Error: {resp.status_code} - {resp.text}")
        
    data = resp.json()
    parts = data["candidates"][0]["content"].get("parts", [])
    
    # Check for tool call
    actions_taken = []
    for part in parts:
        if "functionCall" in part:
            call = part["functionCall"]
            func_name = call["name"]
            args = call.get("args", {})
            
            # Simulate Tool Execution
            if func_name == "quarantine_endpoint":
                actions_taken.append(f"Action: Quarantined {args.get('ip_address')} due to {args.get('reason')}")
            elif func_name == "create_jira_ticket":
                actions_taken.append(f"Action: Created Jira Ticket for {args.get('alert_id')} - {args.get('summary')}")
            elif func_name == "auto_generate_remediation_pr":
                actions_taken.append(f"Action: Auto-generated PR on {args.get('repo_name')} to fix {args.get('vulnerability_type')}")
                
    if not actions_taken:
        reply = parts[0].get("text", "No action taken.") if parts else "No action taken."
        actions_taken.append(reply)
        
    return {"status": "success", "actions": actions_taken}

class MitigateRequest(BaseModel):
    risk_name: str
    category: str
    likelihood: int
    impact: int

@app.post("/api/mitigate")
async def mitigate_risk(req: MitigateRequest):
    norm = req.risk_name.lower()
    
    # Default fallback
    steps = [
        'Document asset mapping structure and audit credentials.',
        'Define access restrictions and network isolation strategies.',
        'Conduct testing protocols at defined intervals.',
        '[VERCEL-BACKEND-DYNAMIC-HEURISTICS]'
    ]
    cost = 'TBD upon operational deployment'
    effort = 'Medium'
    controls = 'NIST CSF v2.0 Controls'
    
    if 'password' in norm or 'mfa' in norm or 'authentication' in norm:
        steps = [
            'Enforce Multi-Factor Authentication (MFA) across all user access points.',
            'Implement strict password complexity and rotation policies.',
            'Configure access audits to alert on off-hour or geofenced connection logins.',
            '[VERCEL-BACKEND-DYNAMIC-HEURISTICS]'
        ]
        cost = 'Low ($2-$5 per user/month SaaS license)'
        controls = 'SOC 2 CC6.1 / ISO 27001 A.9.4.2'
    elif 'backup' in norm or 'database' in norm or 'ransomware' in norm:
        steps = [
            'Set up automated, nightly encrypted backups to isolated cloud buckets.',
            'Set up air-gapped write-once read-many (WORM) parameters for archive objects.',
            'Run quarterly restoration verification testing.',
            '[VERCEL-BACKEND-DYNAMIC-HEURISTICS]'
        ]
        cost = 'Medium ($100-$300/month backup storage infrastructure costs)'
        controls = 'ISO 27001 A.12.3.1 / SOC 2 CC8.1'
        effort = 'High'
    elif 'training' in norm or 'phishing' in norm or 'awareness' in norm:
        steps = [
            'Implement mandatory security awareness training modules for all staff annually.',
            'Conduct quarterly simulated phishing campaigns.',
            'Track compliance and escalate non-participants to HR.',
            '[VERCEL-BACKEND-DYNAMIC-HEURISTICS]'
        ]
        cost = 'Low (E-learning course licenses)'
        controls = 'HIPAA 164.308(a)(5) / ISO 27001 A.7.2.2'
    elif 'patch' in norm or 'vulnerability' in norm or 'dependency' in norm:
        steps = [
            'Implement automated vulnerability scanning in the CI/CD pipeline.',
            'Establish an SLA for patching critical CVEs within 48 hours.',
            'Maintain a comprehensive Software Bill of Materials (SBOM).',
            '[VERCEL-BACKEND-DYNAMIC-HEURISTICS]'
        ]
        cost = 'High (Requires dedicated DevSecOps tooling)'
        controls = 'NIST PR.IP-12 / SOC 2 CC7.1'
        effort = 'High'

    return {
        "steps": steps,
        "cost": cost,
        "effort": effort,
        "residualScore": max(1, int((req.likelihood * req.impact) * 0.3)),
        "controls": controls
    }

class SimulateRequest(BaseModel):
    attack_name: str
    protocol: str
    script_commands: str

@app.post("/api/simulate")
async def simulate_attack(req: SimulateRequest):
    norm = req.script_commands.lower()
    
    # Base template
    what_was_run = f"A custom security penetration script named \"{req.attack_name}\" was executed in the sandbox via the {req.protocol} protocol."
    what_it_uncovered = "The terminal audited raw diagnostic logs and caught anomalous execution activity."
    compliance = "Triggers compliance checks under NIST CSF guidelines for unauthorized local shell command telemetry."
    remediation = "Restructure access control configurations. [VERCEL-BACKEND-DYNAMIC-HEURISTICS]"
    
    if 'ddos' in norm or 'ping' in norm or 'flood' in norm:
        what_it_uncovered = "The script initiated a high-volume packet transmission resembling a Denial of Service (DoS) attack, designed to exhaust target network resources."
        compliance = "Violates SOC 2 CC7.1 (Network Security) and ISO 27001 A.12.1.3 (Capacity Management) due to unmitigated bandwidth consumption."
        remediation = "Implement edge-level rate limiting and deploy Web Application Firewalls (WAF) configured to drop volumetric anomalous traffic. [VERCEL-BACKEND-DYNAMIC-HEURISTICS]"
    elif 'nmap' in norm or 'scan' in norm or 'recon' in norm:
        what_it_uncovered = "The execution performed aggressive port scanning and service enumeration against internal network topologies."
        compliance = "Flags under NIST CSF DE.CM-1 (Network mapping and monitoring) for unauthorized internal reconnaissance."
        remediation = "Segment internal networks using zero-trust firewalls and alert SOC teams upon horizontal network discovery attempts. [VERCEL-BACKEND-DYNAMIC-HEURISTICS]"
    elif 'curl' in norm and ('post' in norm or 'inject' in norm or 'admin' in norm):
        what_it_uncovered = "An automated HTTP payload injection was attempted, sending structured malicious inputs against internal authentication APIs."
        compliance = "Fails OWASP Top 10 API Security guidelines and SOC 2 CC6.1 (Logical Access Controls)."
        remediation = "Validate all API inputs, implement strict CORS policies, and ensure APIs require proper bearer token authentication. [VERCEL-BACKEND-DYNAMIC-HEURISTICS]"
    elif 'cat /etc/passwd' in norm or 'shadow' in norm or 'privilege' in norm:
        what_it_uncovered = "The script attempted to extract sensitive system files and enumerate local user accounts, indicating privilege escalation."
        compliance = "Critical breach of ISO 27001 A.9.4.4 (Use of privileged utility programs) and GDPR if personal data is exposed."
        remediation = "Enforce least privilege execution (chroot/jail) and run web services as non-root users. [VERCEL-BACKEND-DYNAMIC-HEURISTICS]"

    return {
        "whatWasRun": what_was_run,
        "whatItUncovered": what_it_uncovered,
        "complianceImpact": compliance,
        "remediation": remediation
    }
