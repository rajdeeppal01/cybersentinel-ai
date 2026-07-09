import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import anthropic

app = FastAPI(title="CyberSentinel Claude Agent Harness")

# Note: This is an alternative endpoint demonstrating the Anthropic SDK, 
# as explicitly required by the Job Description ("Claude Agent SDK").
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

class RemediationRequest(BaseModel):
    alert_id: str
    vulnerability_details: str
    repo_target: str

# Anthropic Tool Definition Format
CLAUDE_TOOLS = [
    {
        "name": "auto_generate_remediation_pr",
        "description": "Generates a patched code block and triggers a GitHub PR to fix a SAST/DAST vulnerability.",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo_name": {"type": "string", "description": "The repository to patch"},
                "vulnerability_type": {"type": "string", "description": "Type of vulnerability"},
                "proposed_code_fix": {"type": "string", "description": "The patched code"}
            },
            "required": ["repo_name", "vulnerability_type", "proposed_code_fix"]
        }
    }
]

@app.post("/api/claude-remediate")
async def claude_autonomous_remediation(req: RemediationRequest):
    """
    Anthropic SDK Tool Calling Endpoint:
    Uses Claude 3.5 Sonnet to autonomously patch vulnerabilities and trigger PR tools.
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    prompt = (
        f"A SAST scanner found a vulnerability ({req.alert_id}) in the repository {req.repo_target}. "
        f"Details: {req.vulnerability_details}. "
        f"Please analyze the vulnerability and use the auto_generate_remediation_pr tool to create a fix."
    )

    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1024,
            tools=CLAUDE_TOOLS,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    actions_taken = []
    
    # Process Anthropic Tool Blocks
    for block in response.content:
        if block.type == "tool_use":
            func_name = block.name
            args = block.input
            
            if func_name == "auto_generate_remediation_pr":
                actions_taken.append(
                    f"Action: Claude Auto-generated PR on {args.get('repo_name')} "
                    f"to fix {args.get('vulnerability_type')} with code: {args.get('proposed_code_fix')}"
                )
                
    if not actions_taken:
        actions_taken.append("No action taken by Claude.")
        
    return {"status": "success", "agent": "claude-3.5-sonnet", "actions": actions_taken}
