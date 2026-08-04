import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const TerminalInstance = ({ workspaceId, terminalId, onSyncTriggered, isActive }) => {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const wsRef = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (!workspaceId || !terminalId) return;

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

        const webLinksAddon = new WebLinksAddon();
        term.loadAddon(webLinksAddon);

        if (terminalRef.current) {
            term.open(terminalRef.current);
            // Don't fit immediately if hidden, wait for isActive or timeout
            setTimeout(() => {
                if (fitAddonRef.current) fitAddonRef.current.fit();
            }, 10);
        }

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        let reconnectTimeout = null;
        let isUnmounted = false;

        const connectWebSocket = () => {
            if (isUnmounted) return;
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Note: Assuming backend is on port 8000. Use environment variable in prod.
            const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${workspaceId}/${terminalId}`);
            wsRef.current = ws;

            ws.onopen = () => {
                if (fitAddonRef.current && xtermRef.current) {
                    const cols = xtermRef.current.cols;
                    const rows = xtermRef.current.rows;
                    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
                }
                term.write("\x1b[32m[Nexus] Connected to Terminal Server.\x1b[0m\r\n");
                if (isActive) term.focus();
            };

            ws.onerror = () => {
                // error handled by onclose mostly
            };

            ws.onclose = () => {
                if (!isUnmounted) {
                    term.write("\r\n\x1b[33m[Nexus] Connection lost. Reconnecting in 3s...\x1b[0m\r\n");
                    reconnectTimeout = setTimeout(connectWebSocket, 3000);
                }
            };

            ws.onmessage = (event) => {
                if (event.data === "[SYS_SYNC]") {
                    if (onSyncTriggered) onSyncTriggered();
                    return;
                }
                term.write(event.data);
            };
        };

        connectWebSocket();

        const dataDisposable = term.onData((data) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(data);
            }
        });

        const resizeDisposable = term.onResize((size) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
            }
        });

        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            isUnmounted = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            window.removeEventListener('resize', handleResize);
            if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
                wsRef.current.close();
            }
            dataDisposable.dispose();
            resizeDisposable.dispose();
            term.dispose();
        };
    }, [workspaceId, terminalId]);

    useEffect(() => {
        if (isActive && fitAddonRef.current && xtermRef.current) {
            setTimeout(() => {
                fitAddonRef.current.fit();
                xtermRef.current.focus();
            }, 50);
        }
    }, [isActive]);

    useEffect(() => {
        const handleRunCmd = (e) => {
            if (isActive && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(e.detail + '\r\n');
                if (xtermRef.current) xtermRef.current.focus();
            }
        };
        document.addEventListener('terminal-run-command', handleRunCmd);
        return () => document.removeEventListener('terminal-run-command', handleRunCmd);
    }, [isActive]);

    return (
        <div
            ref={terminalRef}
            style={{
                flex: 1,
                padding: '8px',
                overflow: 'hidden',
                display: isActive ? 'block' : 'none',
                height: '100%',
                width: '100%'
            }}
        />
    );
};

const TerminalPanel = ({ workspaceId, isOpen, onClose, onSyncTriggered }) => {
    const [activePanelView, setActivePanelView] = useState('TERMINAL');
    const [terminals, setTerminals] = useState([{ id: 'term-1', name: 'bash' }]);
    const [activeTerminalId, setActiveTerminalId] = useState('term-1');
    const terminalCounter = useRef(1);

    const [isMaximized, setIsMaximized] = useState(false);

    const [panelHeight, setPanelHeight] = useState(300);
    const isDragging = useRef(false);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(300);

    const [sidebarWidth, setSidebarWidth] = useState(120);
    const isSidebarDragging = useRef(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(120);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging.current) {
                const deltaY = dragStartY.current - e.clientY;
                let newHeight = dragStartHeight.current + deltaY;
                if (newHeight < 100) newHeight = 100;
                if (newHeight > window.innerHeight - 100) newHeight = window.innerHeight - 100;
                setPanelHeight(newHeight);
                window.dispatchEvent(new Event('resize'));
            }
            if (isSidebarDragging.current) {
                // Dragging the left edge of the right-sidebar. Moving mouse left (negative deltaX) increases width.
                const deltaX = dragStartX.current - e.clientX;
                let newWidth = dragStartWidth.current + deltaX;
                if (newWidth < 100) newWidth = 100;
                if (newWidth > window.innerWidth - 200) newWidth = window.innerWidth - 200;
                setSidebarWidth(newWidth);
                window.dispatchEvent(new Event('resize'));
            }
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.cursor = 'default';
            }
            if (isSidebarDragging.current) {
                isSidebarDragging.current = false;
                document.body.style.cursor = 'default';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        dragStartY.current = e.clientY;
        dragStartHeight.current = panelHeight;
        document.body.style.cursor = 'ns-resize';
    };

    const handleSidebarMouseDown = (e) => {
        isSidebarDragging.current = true;
        dragStartX.current = e.clientX;
        dragStartWidth.current = sidebarWidth;
        document.body.style.cursor = 'ew-resize';
    };

    if (!isOpen) return null;

    const addTerminal = () => {
        terminalCounter.current += 1;
        const newId = `term-${terminalCounter.current}`;
        setTerminals([...terminals, { id: newId, name: `bash` }]);
        setActiveTerminalId(newId);
    };

    const closeTerminal = (id, e) => {
        if (e) e.stopPropagation();
        const newTerminals = terminals.filter(t => t.id !== id);
        setTerminals(newTerminals);
        if (activeTerminalId === id && newTerminals.length > 0) {
            setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
        }
    };

    const panelTabs = ['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'];

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: isMaximized ? '100%' : `${panelHeight}px`,
            backgroundColor: '#1e1e1e', // VS Code default dark background
            borderTop: '1px solid #333333',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
        }}>
            {/* DRAGGABLE SASH */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    top: '-4px', // overhang a bit for easier grabbing
                    left: 0,
                    right: 0,
                    height: '8px',
                    cursor: 'ns-resize',
                    zIndex: 20
                }}
            />

            {/* MAIN PANEL TABS HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 8px',
                backgroundColor: '#1e1e1e',
                alignItems: 'center',
                fontSize: '11px',
                color: '#cccccc',
                userSelect: 'none'
            }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {panelTabs.map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActivePanelView(tab)}
                            style={{
                                padding: '10px 0',
                                cursor: 'pointer',
                                color: activePanelView === tab ? '#e7e7e7' : '#858585',
                                borderBottom: activePanelView === tab ? '1px solid #007fd4' : '1px solid transparent',
                                letterSpacing: '0.5px'
                            }}
                            onMouseOver={(e) => {
                                if (activePanelView !== tab) e.currentTarget.style.color = '#cccccc';
                            }}
                            onMouseOut={(e) => {
                                if (activePanelView !== tab) e.currentTarget.style.color = '#858585';
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => {
                            setIsMaximized(!isMaximized);
                            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                        }}
                        style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title={isMaximized ? "Restore Panel Size" : "Maximize Panel Size"}
                    >
                        {isMaximized ? (
                            <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.5 13.5v-3h1v2h2v1h-3zm11 0h-3v-1h2v-2h1v3zM13.5 2.5v3h-1v-2h-2v-1h3zm-11 0h3v1h-2v2h-1v-3z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.5 2.5v3h1v-2h2v-1h-3zm11 0h-3v1h2v2h1v-3zM13.5 13.5v-3h-1v2h-2v1h3zm-11 0h3v-1h-2v-2h-1v3z" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Close Panel"
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                            <path fillRule="evenodd" clipRule="evenodd" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* PANEL CONTENT AREA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* TERMINAL VIEW */}
                <div style={{ display: activePanelView === 'TERMINAL' ? 'flex' : 'none', flexDirection: 'row', height: '100%', width: '100%' }}>

                    {/* LEFT PANE: TERMINAL INSTANCES */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {terminals.map(term => (
                            <TerminalInstance
                                key={term.id}
                                workspaceId={workspaceId}
                                terminalId={term.id}
                                onSyncTriggered={onSyncTriggered}
                                isActive={activeTerminalId === term.id}
                            />
                        ))}
                    </div>

                    {/* RIGHT PANE: TERMINAL SIDEBAR */}
                    <div style={{ width: `${sidebarWidth}px`, backgroundColor: '#1e1e1e', borderLeft: '1px solid #333333', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* DRAGGABLE SIDEBAR SASH */}
                        <div
                            onMouseDown={handleSidebarMouseDown}
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: '-4px', // overhang
                                width: '8px',
                                cursor: 'ew-resize',
                                zIndex: 20
                            }}
                        />
                        {/* Sidebar Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', borderBottom: '1px solid transparent' }}>
                            <button
                                onClick={addTerminal}
                                style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="New Terminal"
                            >
                                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                                    <path d="M8.5 2h-1v5.5H2v1h5.5V14h1V8.5H14v-1H8.5V2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => closeTerminal(activeTerminalId)}
                                style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', marginLeft: '4px' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Kill Terminal"
                            >
                                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 011-1h3a1 1 0 011 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z" />
                                </svg>
                            </button>
                        </div>

                        {/* Terminal List */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {terminals.map((term, index) => (
                                <div
                                    key={term.id}
                                    onClick={() => setActiveTerminalId(term.id)}
                                    style={{
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        backgroundColor: activeTerminalId === term.id ? '#37373d' : 'transparent',
                                        color: activeTerminalId === term.id ? '#ffffff' : '#cccccc',
                                    }}
                                    onMouseOver={(e) => {
                                        if (activeTerminalId !== term.id) e.currentTarget.style.backgroundColor = '#2a2d2e';
                                    }}
                                    onMouseOut={(e) => {
                                        if (activeTerminalId !== term.id) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style={{ color: '#858585' }}>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M13.5 13h-11V3h11v10zm-12-11l-.5.5v11l.5.5h12l.5-.5v-11l-.5-.5h-12zM3 11v1h4v-1H3zm2-3.1l2.5 2.5.7-.7L6 7.5l2.2-2.2-.7-.7L5 7.1v.8z" />
                                    </svg>
                                    <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                        {index + 1}: {term.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* OTHER VIEWS */}
                <div style={{ display: activePanelView !== 'TERMINAL' ? 'block' : 'none', padding: '12px', color: '#cccccc', fontFamily: "'Courier New', monospace", fontSize: '13px', overflowY: 'auto', height: '100%' }}>
                    {activePanelView} <br />
                    No content available in this view.
                </div>
            </div>
        </div>
    );
};

export default TerminalPanel;
