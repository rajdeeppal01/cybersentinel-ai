const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:4000/siem');

ws.on('open', () => {
  console.log('Connected to WS');
});

ws.on('message', (data) => {
  console.log('Received SIEM log');
});

setTimeout(() => {
  ws.close();
  console.log('Closed connection after 10s');
}, 10000);
