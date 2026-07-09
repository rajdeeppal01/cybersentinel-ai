import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

app = FastAPI(title="CyberSentinel Agent Harness")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class TriageRequest(BaseModel):
    alert_id: str
    raw_log: str
    source_ip: str

class TriageDecision(BaseModel):
    severity: str
    is_false_positive: bool
    recommended_action: str
    confidence_score: float

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
        f"Analyze this security log and determine the severity. "
        f"Log: {req.raw_log} | Source IP: {req.source_ip}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "severity": {"type": "STRING", "enum": ["Low", "Medium", "High", "Critical"]},
                    "is_false_positive": {"type": "BOOLEAN"},
                    "recommended_action": {"type": "STRING"},
                    "confidence_score": {"type": "NUMBER"}
                },
                "required": ["severity", "is_false_positive", "recommended_action", "confidence_score"]
            }
        }
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
        
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="LLM API Error")
        
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "tools": SECURITY_TOOLS
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
        
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="LLM API Error")
        
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
                
    if not actions_taken:
        reply = parts[0].get("text", "No action taken.") if parts else "No action taken."
        actions_taken.append(reply)
        
    return {"status": "success", "actions": actions_taken}
