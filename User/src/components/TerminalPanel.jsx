import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const TerminalPanel = ({ workspaceId, isOpen, onClose }) => {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const wsRef = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        // Initialize XTerm
        const term = new Terminal({
            theme: {
                background: '#1e1e1e',
                foreground: '#cccccc',
                cursor: '#ffffff',
                selectionBackground: 'rgba(255, 255, 255, 0.3)'
            },
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: 14,
            cursorBlink: true,
            convertEol: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        if (terminalRef.current) {
            term.open(terminalRef.current);
            fitAddon.fit();
        }

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Initialize WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Note: Assuming backend is on port 8000. Use environment variable in prod.
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${workspaceId}`);
        wsRef.current = ws;

        ws.onopen = () => {
            term.focus();
        };

        ws.onmessage = (event) => {
            term.write(event.data);
        };

        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        // Handle resize
        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
            term.dispose();
        };
    }, [isOpen, workspaceId]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '250px',
            backgroundColor: '#1e1e1e',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 12px',
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-color)',
                alignItems: 'center',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                userSelect: 'none'
            }}>
                <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>TERMINAL</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Close Terminal"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>
            <div ref={terminalRef} style={{ flex: 1, padding: '8px', overflow: 'hidden' }} />
        </div>
    );
};

export default TerminalPanel;
