import React, { useState, useEffect, useRef } from 'react';

const AIAssistant = () => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'ai', text: "Hello! I'm your Coder's Nest AI Assistant. How can I help you build today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const userMsg = { id: Date.now(), type: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            setIsTyping(false);
            const aiMsg = { 
                id: Date.now() + 1, 
                type: 'ai', 
                text: "I can help you with that! Here's a suggestion based on your project files. Let me know if you want me to write the code for it." 
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ai-page">
            <style>{`
                .ai-page { 
                    display: flex; 
                    height: 100%; 
                    width: 100%; 
                    background: var(--bg-main); 
                    color: var(--text-primary); 
                    font-family: var(--font-sans);
                }
                
                /* AI SIDEBAR */
                .ai-sidebar {
                    width: 280px;
                    border-right: 1px solid var(--border);
                    background: var(--bg-card);
                    display: flex;
                    flex-direction: column;
                }
                .ai-sidebar-header {
                    padding: 20px;
                    border-bottom: 1px solid var(--border);
                }
                .new-chat-btn {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                    color: white;
                    border: none;
                    border-radius: var(--r-md);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
                }
                .new-chat-btn:hover {
                    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
                    transform: translateY(-2px);
                }
                .history-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 0;
                }
                .history-label {
                    padding: 8px 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    letter-spacing: 0.05em;
                }
                .history-item {
                    padding: 10px 20px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    border-left: 3px solid transparent;
                    transition: all 0.2s;
                }
                .history-item:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
                .history-item.active {
                    background: rgba(139, 92, 246, 0.1);
                    color: #8b5cf6;
                    border-left-color: #8b5cf6;
                    font-weight: 500;
                }

                /* CHAT AREA */
                .ai-chat-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-main);
                    position: relative;
                }
                .ai-chat-header {
                    padding: 20px 30px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(10px);
                }
                .ai-chat-title {
                    font-weight: 700;
                    font-size: 1.1rem;
                    background: linear-gradient(90deg, #8b5cf6, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .ai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    scroll-behavior: smooth;
                }
                .ai-msg-row {
                    display: flex;
                    gap: 16px;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                }
                .ai-msg-row.user {
                    flex-direction: row-reverse;
                }
                .ai-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .ai-avatar.ai {
                    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                    color: white;
                    box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
                }
                .ai-avatar.user {
                    background: #2563eb;
                    color: white;
                    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
                }
                .ai-bubble {
                    padding: 16px 20px;
                    border-radius: 16px;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    position: relative;
                }
                .ai-bubble.ai {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-top-left-radius: 4px;
                    color: var(--text-primary);
                }
                .ai-bubble.user {
                    background: #2563eb;
                    color: white;
                    border-top-right-radius: 4px;
                }
                
                /* TYPING INDICATOR */
                .typing-dots {
                    display: flex;
                    gap: 6px;
                    padding: 8px 4px;
                }
                .typing-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--text-muted);
                    border-radius: 50%;
                    animation: pulse 1.4s infinite ease-in-out both;
                }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes pulse {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }

                /* INPUT AREA */
                .ai-input-container {
                    padding: 30px 40px;
                    background: linear-gradient(to top, var(--bg-main) 50%, transparent);
                }
                .ai-input-box {
                    max-width: 800px;
                    margin: 0 auto;
                    position: relative;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    padding: 8px 16px;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    transition: all 0.2s;
                }
                .ai-input-box:focus-within {
                    border-color: #8b5cf6;
                    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.1);
                }
                .ai-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    padding: 12px 8px;
                    font-size: 0.95rem;
                    color: var(--text-primary);
                    resize: none;
                    height: 44px;
                    font-family: inherit;
                }
                .ai-input::placeholder {
                    color: var(--text-muted);
                }
                .ai-send-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: #8b5cf6;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ai-send-btn:hover {
                    background: #7c3aed;
                    transform: scale(1.05);
                }
                .ai-send-btn:disabled {
                    background: var(--border);
                    color: var(--text-muted);
                    cursor: not-allowed;
                    transform: none;
                }
                .ai-icon-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .ai-icon-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
            `}</style>

            {/* Left Sidebar History */}
            <div className="ai-sidebar">
                <div className="ai-sidebar-header">
                    <button className="new-chat-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Chat
                    </button>
                </div>
                <div className="history-list">
                    <div className="history-label">Today</div>
                    <div className="history-item active">Authentication Flow Bug</div>
                    <div className="history-item">Regex for Email Validation</div>
                    <div className="history-label" style={{ marginTop: '16px' }}>Yesterday</div>
                    <div className="history-item">Optimize React Re-renders</div>
                    <div className="history-item">Postgres JOIN query help</div>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="ai-chat-area">
                <div className="ai-chat-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                        <path d="M12 12 2.1 7.1" />
                        <path d="m12 12 7.1 7.1" />
                    </svg>
                    <span className="ai-chat-title">Coder's Nest AI Assistant</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: '12px', fontWeight: '600' }}>GPT-4 Turbo</span>
                    </div>
                </div>

                <div className="ai-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-msg-row ${msg.type}`}>
                            <div className={`ai-avatar ${msg.type}`}>
                                {msg.type === 'ai' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                        <path d="M2 12h4l3-9 5 18 3-9h5" />
                                    </svg>
                                ) : (
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>JD</span>
                                )}
                            </div>
                            <div className={`ai-bubble ${msg.type}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="ai-msg-row ai">
                            <div className="ai-avatar ai">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                    <path d="M2 12h4l3-9 5 18 3-9h5" />
                                </svg>
                            </div>
                            <div className="ai-bubble ai">
                                <div className="typing-dots">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-input-container">
                    <div className="ai-input-box">
                        <button className="ai-icon-btn" title="Attach file">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                        </button>
                        <textarea 
                            className="ai-input"
                            placeholder="Message AI Assistant..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button className="ai-icon-btn" title="Voice dictation" style={{ marginRight: '8px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                        </button>
                        <button 
                            className="ai-send-btn" 
                            disabled={!input.trim()}
                            onClick={handleSend}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
