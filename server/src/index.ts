import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import http from 'http';
import * as pty from 'node-pty';
import os from 'os';
import { prisma } from './db';
import authRouter, { authenticateToken } from './auth';

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
  { source: '10.0.0.12', event: 'Successful login', severity: 'info', details: 'User admin authenticated successfully via SSH.' },
  { source: '192.168.1.45', event: 'Firewall block', severity: 'warning', details: 'Blocked incoming traffic on port 3389 (RDP).' },
  { source: '10.0.0.8', event: 'Database query', severity: 'info', details: 'SELECT * FROM users WHERE active = 1' },
  { source: '172.16.0.100', event: 'Malware signature detected', severity: 'critical', details: 'Signature match for WannaCry variant in payload.' },
  { source: '10.0.0.12', event: 'Failed login', severity: 'warning', details: 'Failed SSH login attempt for root.' },
  { source: '192.168.1.200', event: 'Large data transfer', severity: 'critical', details: 'Outbound transfer of 50GB detected on port 443.' },
  { source: '10.0.0.5', event: 'Service started', severity: 'info', details: 'Nginx web server started successfully.' },
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
      
      // Autonomous SOC Agent Triage Logic
      const autoTriage = async (log: any) => {
        const textLog = JSON.stringify(log);
        if (textLog.includes('WannaCry') || textLog.includes('Large data transfer')) {
          try {
            await prisma.threatLog.create({
              data: {
                sourceIp: log.source,
                destIp: 'Internal Network',
                severity: log.severity,
                detectedThreat: log.event,
                confidence: 95.5,
                mitreCode: 'T1048',
                mitreName: 'Exfiltration Over Alternative Protocol',
                analysisSummary: `Autonomous Agent detected ${log.event}: ${log.details}`
              }
            });
            console.log(`[AUTONOMOUS AGENT] Critical threat triaged and logged to DB: ${log.event}`);
          } catch (e) {
            console.error('Failed to auto-triage threat', e);
          }
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
