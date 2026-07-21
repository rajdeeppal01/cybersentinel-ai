import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import http from 'http';
import * as pty from 'node-pty';
import os from 'os';
import { prisma } from './db';
import authRouter, { authenticateToken } from './auth';

import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { FakeListLLM } from '@langchain/core/utils/testing';
import { ChatOpenAI } from '@langchain/openai';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CyberSentinel-Backend' });
});

// GET /api/risks
app.get('/api/risks', async (req, res) => {
  try {
    const risks = await prisma.riskRegister.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch risk registers' });
  }
});

// POST /api/risks
app.post('/api/risks', async (req, res) => {
  try {
    const newRisk = await prisma.riskRegister.create({
      data: req.body
    });
    res.json(newRisk);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create risk register' });
  }
});

// GET /api/logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.threatLog.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch threat logs' });
  }
});

// POST /api/logs
app.post('/api/logs', async (req, res) => {
  try {
    const newLog = await prisma.threatLog.create({
      data: req.body
    });
    res.json(newLog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create threat log' });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// SIEM Mock Log Generator
const SAMPLE_LOGS = [
  { event: 'Failed Login Attempt', source: '192.168.1.45', severity: 'LOW', details: 'Invalid credentials for admin', lat: 37.7749, lng: -122.4194 },
  { event: 'Port Scan Detected', source: '10.0.0.5', severity: 'MEDIUM', details: 'Nmap scan on port 22, 80, 443', lat: 51.5074, lng: -0.1278 },
  { event: 'Malware Signature Match', source: '172.16.0.23', severity: 'CRITICAL', details: 'WannaCry ransomware payload', lat: 55.7558, lng: 37.6173 },
  { event: 'Unauthorized Access', source: '192.168.1.10', severity: 'HIGH', details: 'Access to restricted HR database', lat: -33.8688, lng: 151.2093 },
  { event: 'Large data transfer', source: '10.0.0.12', severity: 'CRITICAL', details: '50GB transferred to external IP', lat: 35.6895, lng: 139.6917 }
];

wss.on('connection', (ws: WebSocket, req) => {
  console.log('Client connected to WebSocket:', req.socket.remoteAddress);
  
  // Simulate live SIEM log stream every ~1.2 seconds
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const randomLog = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
      const newLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        ...randomLog
      };
      
      // Autonomous SOC Agent Triage Logic (LangChain Integrated)
      const autoTriage = async (log: any) => {
        try {
          // Initialize a mock LLM for local dev without an API key
          const llm = new FakeListLLM({
            responses: [
              `{"isThreat": ${log.severity === 'CRITICAL' ? 'true' : 'false'}, "confidence": 92.5, "mitreCode": "T1190", "mitreName": "Exploit Public-Facing Application", "reasoning": "Detected anomalous signature matching known CVE patterns."}`
            ]
          });

          const prompt = PromptTemplate.fromTemplate(`
            You are an autonomous AI SOC Agent. Analyze the following network log and determine if it represents a critical threat.
            Return a JSON object with: isThreat (boolean), confidence (number 0-100), mitreCode (string), mitreName (string), reasoning (string).
            Log Data: {logData}
          `);

          const chain = prompt.pipe(llm).pipe(new StringOutputParser());
          const response = await chain.invoke({ logData: JSON.stringify(log) });
          const analysis = JSON.parse(response);

          if (analysis.isThreat) {
            await prisma.threatLog.create({
              data: {
                sourceIp: log.source,
                destIp: 'Internal Network',
                severity: log.severity,
                detectedThreat: log.event,
                confidence: analysis.confidence,
                mitreCode: analysis.mitreCode,
                mitreName: analysis.mitreName,
                analysisSummary: analysis.reasoning
              }
            });
            console.log(`[LANGCHAIN AGENT] Critical threat triaged and logged to DB: ${log.event}`);
            
            // Mock Webhook Dispatch
            console.log(`[WEBHOOK] Dispatched alert to Slack #incident-response for threat: ${log.event}`);
          }
        } catch (e) {
          console.error('[LANGCHAIN AGENT] Failed to analyze threat:', e);
        }
      };

      autoTriage(newLog);

      ws.send(JSON.stringify({ type: 'SIEM_LOG', data: newLog }));
    }
  }, 1200);

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    clearInterval(interval);
  });
});

// Setup PTY WebSocket Server for Sandbox Terminal
const wssPty = new WebSocketServer({ noServer: true });

wssPty.on('connection', (ws: WebSocket) => {
  console.log('Sandbox terminal connected.');
  
  // Use powershell on Windows, bash on others for local dev proof-of-concept
  // In a real prod environment, this would run `docker run -i --rm my-sandbox-image`
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env as any
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  ws.on('message', (msg) => {
    ptyProcess.write(msg.toString());
  });

  ws.on('close', () => {
    ptyProcess.kill();
  });
});

// Route upgrades to the correct WebSocket server
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  
  if (pathname === '/siem') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/pty') {
    wssPty.handleUpgrade(request, socket, head, (ws) => {
      wssPty.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
