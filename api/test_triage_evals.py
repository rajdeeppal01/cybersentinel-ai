import pytest
import os
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@pytest.mark.asyncio
async def test_triage_structured_output():
    """
    Eval 1: Verifies that the agent always returns strict JSON
    matching the TriageDecision schema, avoiding hallucinations.
    """
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY is required for eval tests.")
        
    payload = {
        "alert_id": "ALT-1001",
        "raw_log": "Failed password for root from 192.168.1.50 port 22 ssh2",
        "source_ip": "192.168.1.50"
    }
    
    # We test the fastAPI logic directly via the API or importing the router.
    # For a unit test, we will hit the local LLM generation function, 
    # but since this is a self-contained test file, we'll invoke the LLM directly 
    # to mirror the backend logic (or we could use Fastapi TestClient).
    # Using TestClient is better.
    from fastapi.testclient import TestClient
    from agent import app
    
    client = TestClient(app)
    
    response = client.post("/api/triage", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "severity" in data
    assert "is_false_positive" in data
    assert "recommended_action" in data
    assert "confidence_score" in data
    
    assert data["severity"] in ["Low", "Medium", "High", "Critical"]

@pytest.mark.asyncio
async def test_agent_guardrails_quarantine():
    """
    Eval 2: Tests if the agent correctly uses the Tool Calling
    to quarantine an endpoint when a CRITICAL threat is detected.
    """
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY is required for eval tests.")
        
    payload = {
        "alert_id": "ALT-9999",
        "raw_log": "Ransomware.Locky detected. High volume of file encryption and extension changes (.locky).",
        "source_ip": "10.0.0.45"
    }
    
    from fastapi.testclient import TestClient
    from agent import app
    
    client = TestClient(app)
    
    response = client.post("/api/remediate", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "actions" in data
    
    # The agent MUST decide to quarantine based on the prompt instructions
    actions_str = " ".join(data["actions"])
    assert "Quarantined 10.0.0.45" in actions_str, "Agent failed to trigger the quarantine tool for ransomware."

@pytest.mark.asyncio
async def test_agent_guardrails_benign():
    """
    Eval 3: Tests if the agent knows NOT to take action for a benign event,
    ensuring it doesn't hallucinate a quarantine on normal traffic.
    """
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY is required for eval tests.")
        
    payload = {
        "alert_id": "ALT-0001",
        "raw_log": "Successful login for user rajdeep from 192.168.1.100 port 443",
        "source_ip": "192.168.1.100"
    }
    
    from fastapi.testclient import TestClient
    from agent import app
    
    client = TestClient(app)
    
    response = client.post("/api/remediate", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "actions" in data
    
    actions_str = " ".join(data["actions"]).lower()
    assert "quarantined" not in actions_str, "Agent hallucinated a quarantine on benign traffic."
    assert "benign" in actions_str or "no action" in actions_str, "Agent did not correctly identify benign event."

@pytest.mark.asyncio
async def test_agent_auto_pr_generation():
    """
    Eval 4: Tests if the agent can go beyond triage and auto-generate 
    a remediation Pull Request when presented with a SAST code vulnerability.
    """
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY is required for eval tests.")
        
    payload = {
        "alert_id": "SAST-SQLi-001",
        "raw_log": "Vulnerability: SQL Injection. The endpoint /login directly concatenates user input 'username' into the SQL query: \"SELECT * FROM users WHERE username = '\" + username + \"'\". Fix this using parameterized queries.",
        "source_ip": "127.0.0.1"
    }
    
    from fastapi.testclient import TestClient
    from agent import app
    
    client = TestClient(app)
    
    response = client.post("/api/remediate", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "actions" in data
    
    actions_str = " ".join(data["actions"]).lower()
    assert "auto-generated pr" in actions_str, "Agent failed to trigger the auto_generate_remediation_pr tool."
    assert "sql" in actions_str or "injection" in actions_str, "Agent failed to extract the vulnerability type for the PR."
