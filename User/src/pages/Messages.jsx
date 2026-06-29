import React, { useState, useEffect, useRef } from 'react';

const Messages = () => {
    // 1. Far-Left Strip Selection (Home vs Projects)
    const [activeServer, setActiveServer] = useState('home');
    
    // 2. Inner Sidebar Selection (Which DM or Channel is active)
    const [activeChat, setActiveChat] = useState('dm-1');
    
    const [showModal, setShowModal] = useState(false);
    const [newInput, setNewInput] = useState('');

    // --- Mock Data ---
    const servers = [
        { id: 'home', name: 'Direct Messages', icon: '💬', color: 'var(--accent)' },
        { id: 'p1', name: 'Joker Project', icon: 'J', color: '#8B5CF6' },
        { id: 'p2', name: 'Batman Project', icon: 'B', color: '#10B981' }
    ];

    const [chatData, setChatData] = useState({
        'home': {
            title: 'Direct Messages',
            type: 'dm',
            items: [
                { id: 'dm-1', name: "Sarah Lee", unread: 2, avatar: "SL", color: "#f59e0b", status: "Online" },
                { id: 'dm-2', name: "Mike Chen", unread: 0, avatar: "MC", color: "#10b981", status: "Offline" },
            ]
        },
        'p1': {
            title: 'Project: Joker',
            type: 'project',
            items: [
                { id: 'p1-1', name: "frontend-team", unread: 5 },
                { id: 'p1-2', name: "backend-devs", unread: 0 },
                { id: 'p1-3', name: "testing-qa", unread: 0 },
            ]
        },
        'p2': {
            title: 'Project: Batman',
            type: 'project',
            items: [
                { id: 'p2-1', name: "general", unread: 0 },
                { id: 'p2-2', name: "ui-design", unread: 0 },
            ]
        }
    });

    // Dummy messages for the active chat window
    const [messages, setMessages] = useState([
        { id: 1, senderId: 2, senderName: "Sarah Lee", text: "Hey! The new Discord-style layout makes so much more sense.", time: "10:00 AM", isMe: false },
        { id: 2, senderId: 'me', senderName: "You", text: "Right? It's perfectly separated now. Very clean.", time: "10:05 AM", isMe: true },
    ]);
    const [chatInput, setChatInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- Interactive Functions ---

    const handleServerSwitch = (serverId) => {
        setActiveServer(serverId);
        // Auto-select the first chat in the newly selected server
        const firstItem = chatData[serverId].items[0];
        if (firstItem) setActiveChat(firstItem.id);
        else setActiveChat(null);
    };

    const handleCreateChat = () => {
        if (!newInput.trim()) return;
        
        const isDM = chatData[activeServer].type === 'dm';
        const newId = isDM ? `dm-${Date.now()}` : `chan-${Date.now()}`;
        const name = isDM ? newInput : newInput.toLowerCase().replace(/\s+/g, '-');
        
        const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#F59E0B", "#10B981"];
        
        const newItem = isDM 
            ? { id: newId, name: name, unread: 0, avatar: name.substring(0, 2).toUpperCase(), color: colors[Math.floor(Math.random() * colors.length)], status: 'Online' }
            : { id: newId, name: name, unread: 0 };

        setChatData(prev => ({
            ...prev,
            [activeServer]: {
                ...prev[activeServer],
                items: [newItem, ...prev[activeServer].items]
            }
        }));
        
        setActiveChat(newId);
        setShowModal(false);
        setNewInput('');
        setMessages(isDM ? [] : [{ id: Date.now(), senderId: 'system', senderName: "System", text: `Welcome to #${name}!`, time: "Just now", isMe: false }]);
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setMessages([...messages, { 
            id: Date.now(), senderId: 'me', senderName: "You", text: chatInput, time: "Just now", isMe: true 
        }]);
        setChatInput('');
    };

    // Helper to get active chat details for the header
    const activeSection = chatData[activeServer];
    const activeDetails = activeSection?.items.find(i => i.id === activeChat) || null;

    return (
        <div className="messages-container">
            <style>{`
                /* Core Layout: 3 Columns */
                .messages-container { 
                    flex: 1; 
                    display: flex; 
                    height: calc(100vh - 64px); /* assuming top nav */
                    background: var(--bg-page); 
                    font-family: 'Inter', sans-serif;
                }
                
                /* Column 1: Far-Left Server Strip */
                .server-strip {
                    width: 72px;
                    background: var(--bg-sidebar);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px 0;
                    gap: 12px;
                    flex-shrink: 0;
                }
                .server-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .server-icon:hover {
                    border-radius: 16px;
                }
                .server-icon.active {
                    border-radius: 16px;
                }
                /* Active pill indicator */
                .server-icon::before {
                    content: '';
                    position: absolute;
                    left: -12px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 0px;
                    background: var(--text-primary);
                    border-radius: 0 4px 4px 0;
                    transition: height 0.2s;
                }
                .server-icon:hover::before { height: 20px; }
                .server-icon.active::before { height: 40px; }
                
                .server-separator {
                    width: 32px;
                    height: 2px;
                    background: var(--border);
                    border-radius: 2px;
                    margin: 4px 0;
                }

                /* Column 2: Inner Channel/DM Sidebar */
                .channel-sidebar { 
                    width: 260px; 
                    background: var(--bg-sidebar);
                    border-right: 1px solid var(--border); 
                    display: flex; 
                    flex-direction: column; 
                    flex-shrink: 0;
                }
                .channel-sidebar-header { 
                    height: 60px;
                    padding: 0 16px; 
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .channel-sidebar-title { 
                    font-size: 1rem; 
                    font-weight: 800; 
                    color: var(--text-primary);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .channel-content { 
                    flex: 1; 
                    overflow-y: auto; 
                    padding: 16px 12px; 
                }

                .sidebar-action-btn { 
                    background: transparent; border: none; color: var(--text-secondary); 
                    cursor: pointer; padding: 4px; border-radius: 4px; transition: 0.2s;
                }
                .sidebar-action-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

                /* Chat Items (Middle Column) */
                .chat-item { 
                    display: flex; align-items: center; padding: 8px 12px; 
                    border-radius: 6px; cursor: pointer; margin-bottom: 4px;
                    color: var(--text-secondary);
                }
                .chat-item:hover { background: var(--bg-hover); color: var(--text-primary); }
                .chat-item.active { background: rgba(37,99,235,0.08); color: var(--text-primary); }

                /* Avatars for DMs */
                .item-avatar { 
                    width: 32px; height: 32px; border-radius: var(--r-full); 
                    display: flex; align-items: center; justify-content: center; 
                    color: white; font-weight: 700; font-size: 0.8rem; 
                    margin-right: 12px; flex-shrink: 0; position: relative;
                }
                .dm-status { 
                    position: absolute; bottom: -2px; right: -2px; 
                    width: 10px; height: 10px; background: #10B981; 
                    border: 2px solid var(--bg-sidebar); border-radius: 50%; 
                }

                /* Hash for Channels */
                .item-hash { 
                    font-weight: 600; font-size: 1.2rem; margin-right: 12px; opacity: 0.7;
                }
                .chat-item.active .item-hash { color: var(--accent); opacity: 1; }

                .item-info { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; }
                .item-name { font-weight: 500; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .chat-item.active .item-name { font-weight: 600; }
                
                .unread-badge { 
                    background: var(--danger, #ef4444); color: white; font-size: 0.7rem; font-weight: 700; 
                    padding: 2px 6px; border-radius: 10px; margin-left: 8px;
                }

                /* Column 3: Main Chat Window */
                .chat-window { 
                    flex: 1; display: flex; flex-direction: column; 
                    background: var(--bg-page); min-width: 0;
                }

                /* Header */
                .chat-header { 
                    height: 60px; padding: 0 24px; border-bottom: 1px solid var(--border); 
                    display: flex; align-items: center; justify-content: space-between;
                    background: var(--bg-card);
                }
                .chat-header-info { display: flex; align-items: center; }
                .chat-header-name { font-weight: 700; font-size: 1.1rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;}
                .chat-header-status { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
                
                .chat-header-actions { display: flex; gap: 12px; }
                .chat-action-btn { 
                    background: transparent; border: none; color: var(--text-secondary); 
                    cursor: pointer; padding: 8px; border-radius: var(--r-md); 
                }
                .chat-action-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

                /* History */
                .chat-history { 
                    flex: 1; padding: 24px; overflow-y: auto; 
                    display: flex; flex-direction: column; gap: 16px;
                }
                .msg-wrapper { display: flex; max-width: 75%; align-items: flex-end; }
                .msg-wrapper.received { align-self: flex-start; }
                .msg-wrapper.sent { align-self: flex-end; flex-direction: row-reverse; }
                
                .msg-avatar { 
                    width: 32px; height: 32px; border-radius: var(--r-md); 
                    display: flex; align-items: center; justify-content: center; 
                    font-size: 0.8rem; font-weight: bold; color: white; margin: 0 12px; flex-shrink: 0; 
                }
                
                .msg-content { display: flex; flex-direction: column; gap: 4px; }
                .msg-wrapper.sent .msg-content { align-items: flex-end; }
                
                .msg-bubble { 
                    padding: 12px 16px; font-size: 0.95rem; line-height: 1.5; border-radius: 8px;
                }
                .msg-wrapper.received .msg-bubble { 
                    background: var(--bg-card); color: var(--text-primary); 
                    border: 1px solid var(--border);
                    border-bottom-left-radius: 2px;
                }
                .msg-wrapper.sent .msg-bubble { 
                    background: var(--accent); color: white; 
                    border-bottom-right-radius: 2px;
                }
                .msg-time { font-size: 0.7rem; color: var(--text-muted); }

                /* Input Area */
                .chat-input-wrapper {
                    padding: 20px 24px;
                }
                .chat-input-area { 
                    display: flex; align-items: center; gap: 12px; 
                }
                
                .chat-attach-btn { 
                    background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted); 
                    cursor: pointer; width: 44px; height: 44px; border-radius: var(--r-md); 
                    display: flex; align-items: center; justify-content: center; transition: 0.2s;
                }
                .chat-attach-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
                
                .chat-input-box { 
                    flex: 1; padding: 12px 16px; background: var(--bg-card); 
                    border: 1px solid var(--border); border-radius: var(--r-md);
                    color: var(--text-primary); outline: none; font-size: 0.95rem;
                }
                .chat-input-box:focus { border-color: var(--accent); }
                
                .chat-send-btn { 
                    background: var(--accent); color: white; border: none; 
                    width: 44px; height: 44px; border-radius: var(--r-md); 
                    display: flex; align-items: center; justify-content: center; cursor: pointer; 
                }
                .chat-send-btn:hover { background: var(--accent-hover); }

                /* --- Modals --- */
                .modal-overlay { 
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5); 
                    z-index: 300; display: flex; align-items: center; justify-content: center; 
                }
                .modal-content { 
                    background: var(--bg-card); border: 1px solid var(--border); 
                    border-radius: var(--r-lg); padding: 32px; max-width: 400px; width: 90%; 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
                }
                
                .modal-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
                .modal-desc { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 24px; }
                
                .form-input { 
                    width: 100%; padding: 12px 16px; border: 1px solid var(--border); 
                    border-radius: var(--r-md); background: var(--bg-input); color: var(--text-primary); 
                    font-size: 0.95rem; margin-bottom: 24px;
                }
                .form-input:focus { border-color: var(--accent); outline: none; }
                
                .modal-actions { display: flex; gap: 12px; }
                .btn { padding: 10px 16px; border-radius: var(--r-md); font-weight: 600; font-size: 0.9rem; cursor: pointer; flex: 1; border: none; }
                .btn-secondary { background: var(--bg-hover); color: var(--text-primary); }
                .btn-secondary:hover { background: var(--border); }
                .btn-primary { background: var(--accent); color: white; }
                .btn-primary:hover { background: var(--accent-hover); }
            `}</style>

            {/* --- COLUMN 1: Server Strip (Far Left) --- */}
            <div className="server-strip">
                {/* Home / DMs Icon */}
                <div 
                    className={`server-icon ${activeServer === 'home' ? 'active' : ''}`}
                    style={{ background: 'var(--accent)' }}
                    onClick={() => handleServerSwitch('home')}
                    title="Direct Messages"
                >
                    💬
                </div>
                
                <div className="server-separator"></div>
                
                {/* Project Icons */}
                {servers.filter(s => s.id !== 'home').map(server => (
                    <div 
                        key={server.id}
                        className={`server-icon ${activeServer === server.id ? 'active' : ''}`}
                        style={{ background: server.color }}
                        onClick={() => handleServerSwitch(server.id)}
                        title={server.name}
                    >
                        {server.icon}
                    </div>
                ))}
                
                <div className="server-separator" style={{ marginTop: 'auto' }}></div>
                <div className="server-icon" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }} title="Add Project">
                    +
                </div>
            </div>

            {/* --- COLUMN 2: Inner Channel/DM Sidebar --- */}
            <div className="channel-sidebar">
                <div className="channel-sidebar-header">
                    <div className="channel-sidebar-title">{activeSection?.title}</div>
                    <button 
                        className="sidebar-action-btn" 
                        onClick={() => setShowModal(true)}
                        title={activeSection?.type === 'dm' ? "New DM" : "New Channel"}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="channel-content">
                    {activeSection?.items.map(item => (
                        <div 
                            key={item.id} 
                            className={`chat-item ${activeChat === item.id ? 'active' : ''}`}
                            onClick={() => setActiveChat(item.id)}
                        >
                            {activeSection.type === 'dm' ? (
                                <div className="item-avatar" style={{ background: item.color || 'var(--accent)' }}>
                                    {item.avatar}
                                    {item.status === 'Online' && <div className="dm-status"></div>}
                                </div>
                            ) : (
                                <div className="item-hash">#</div>
                            )}
                            
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                {item.unread > 0 && <span className="unread-badge">{item.unread}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- COLUMN 3: Right Chat Window --- */}
            <div className="chat-window">
                {activeDetails ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-info">
                                {activeSection.type === 'dm' ? (
                                    <>
                                        <div className="chat-header-name">
                                            <span style={{ fontSize: '1.2rem', marginRight: 4 }}>@</span>
                                            {activeDetails.name}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="chat-header-name">
                                            <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginRight: 4 }}>#</span>
                                            {activeDetails.name}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="chat-header-actions">
                                {activeSection.type === 'dm' && (
                                    <button className="chat-action-btn" title="Start Call">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    </button>
                                )}
                                <button className="chat-action-btn" title="More Info">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                </button>
                            </div>
                        </div>

                        <div className="chat-history">
                            {messages.length === 0 ? (
                                <div style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto'}}>
                                    <div style={{fontSize: '3rem', marginBottom: 16}}>👋</div>
                                    <h3 style={{color: 'var(--text-primary)', marginBottom: 8}}>Say Hello!</h3>
                                    <p>This is the beginning of your chat history.</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`msg-wrapper ${msg.isMe ? 'sent' : 'received'}`}>
                                        {!msg.isMe && msg.senderId !== 'system' && (
                                            <div className="msg-avatar" style={{ background: activeSection.type === 'dm' ? activeDetails.color : 'var(--accent)' }}>
                                                {activeSection.type === 'dm' ? activeDetails.avatar : 'U'}
                                            </div>
                                        )}
                                        <div className="msg-content">
                                            <div className="msg-bubble">{msg.text}</div>
                                            <div className="msg-time">{msg.time}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-wrapper">
                            <div className="chat-input-area">
                                <button className="chat-attach-btn" title="Attach file">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                </button>
                                <input 
                                    type="text" 
                                    className="chat-input-box" 
                                    placeholder={`Message ${activeSection.type === 'dm' ? '@' + activeDetails.name : '#' + activeDetails.name}...`} 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button className="chat-send-btn" onClick={handleSendMessage} title="Send">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: -2, marginTop: 2}}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                        Select a chat to start messaging
                    </div>
                )}
            </div>

            {/* --- MODAL --- */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-title">
                            {activeSection.type === 'dm' ? 'New Direct Message' : 'Create New Channel'}
                        </div>
                        <div className="modal-desc">
                            {activeSection.type === 'dm' 
                                ? 'Search for a developer to start a private chat.'
                                : `Create a new discussion group in ${activeSection.title}.`
                            }
                        </div>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder={activeSection.type === 'dm' ? "Developer's name" : "e.g. devops"} 
                            value={newInput}
                            onChange={(e) => setNewInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
                        />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateChat}>
                                {activeSection.type === 'dm' ? 'Start Chat' : 'Create Channel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
