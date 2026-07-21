import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function InteractiveTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#03050b',
        foreground: '#00f0ff',
        cursor: '#00f0ff',
      },
      fontFamily: 'monospace',
      fontSize: 14,
      cursorBlink: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    const ws = new WebSocket('ws://localhost:4000/pty');

    ws.onopen = () => {
      term.writeln('\x1b[36m*** Connected to CyberSentinel Interactive Sandbox ***\x1b[0m');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        term.write(event.data);
      } else {
        // Blob data (from powershell/bash pty in some cases)
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            term.write(reader.result);
          }
        };
        reader.readAsText(event.data);
      }
    };

    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, []);

  return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
}
