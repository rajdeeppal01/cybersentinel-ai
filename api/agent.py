import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
from api.claude_agent import router as claude_router

app = FastAPI(title="CyberSentinel Agent Harness")

# Expose the Claude Agent SDK endpoint as well
app.include_router(claude_router)

# Note: We are using Gemini API here because the user is on the free tier.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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

@app.post("/api/triage", response_model=TriageDecision)
async def autonomous_triage(req: TriageRequest):
    """
    Structured Output Endpoint:
    Forces the LLM to output a strict JSON decision matrix for an alert.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = (
        f"You are a senior security analyst providing a review of a security log. "
        f"Analyze this security log and return the analysis. "
        f"Log: {req.raw_log} | Source IP: {req.source_ip} "
        f"Be precise about MITRE ATT&CK codes."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "detectedThreat": {"type": "STRING"},
                    "confidence": {"type": "NUMBER"},
                    "severity": {"type": "STRING", "enum": ["low", "medium", "high", "critical"]},
                    "mitreCode": {"type": "STRING"},
                    "mitreName": {"type": "STRING"},
                    "mitreDescription": {"type": "STRING"},
                    "grcControls": {
                        "type": "OBJECT",
                        "properties": {
                            "nist": {"type": "STRING"},
                            "soc2": {"type": "STRING"},
                            "iso27001": {"type": "STRING"},
                            "gdpr": {"type": "STRING"}
                        }
                    },
                    "analysisSummary": {"type": "STRING"},
                    "impact": {"type": "STRING"},
                    "incidentResponsePlaybook": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    }
                },
                "required": ["detectedThreat", "confidence", "severity", "mitreCode", "mitreName", "mitreDescription", "grcControls", "analysisSummary", "impact", "incidentResponsePlaybook"]
            }
        }
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
        
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"LLM API Error: {resp.status_code} - {resp.text}")
        
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    try:
        decision = json.loads(text)
        return decision
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM output invalid JSON")


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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
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
