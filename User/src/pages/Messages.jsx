import React, { useState, useEffect, useRef } from 'react';
import api, { getWsBaseUrl } from '../utils/api';

const Messages = () => {
    // --- Modern Navigation State ---
    // 'global' or 'dms' (We dropped the 3-column Discord style for a sleek 2-column layout!)
    const [activeTab, setActiveTab] = useState('global');

    // The currently selected chat target (either 'global_room' or a user_id)
    const [activeTarget, setActiveTarget] = useState('global_room');
    const [activeTargetName, setActiveTargetName] = useState('Global Space');
    
    const activeTabRef = useRef(activeTab);
    const activeTargetRef = useRef(activeTarget);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useEffect(() => {
        activeTargetRef.current = activeTarget;
    }, [activeTarget]);

    // --- Data States ---
    const [currentUser, setCurrentUser] = useState(null);
    const [dmList, setDmList] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Initialize User & WS
    useEffect(() => {
        let isMounted = true;
        const token = sessionStorage.getItem('cn-access-token');
        if (token) {
            api.get('/users/me').then(res => {
                if (!isMounted) return;
                setCurrentUser(res.data);
                connectWebSocket(res.data.user_id);
            }).catch(err => console.error("Failed to fetch user", err));
        }
        fetchSidebarData();

        return () => { 
            isMounted = false;
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, []);

    const fetchSidebarData = async () => {
        try {
            const dmRes = await api.get('/chat/dm/sidebar');
            setDmList(dmRes.data);

            const projRes = await api.get('/projects/');
            setProjects(projRes.data);
            
            const usersRes = await api.get('/users/');
            setAllUsers(usersRes.data);
        } catch (error) {
            console.error("Error fetching sidebar data:", error);
        }
    };

    const connectWebSocket = (userId) => {
        const wsUrl = `${getWsBaseUrl()}/chat/ws/universal`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            socket.send(JSON.stringify({ sender_id: userId, type: "AUTH" }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages(prev => {
                const currentTab = activeTabRef.current;
                const currentTarget = activeTargetRef.current;

                if (data.type === 'GLOBAL' && currentTab === 'global') return [...prev, data];
                if (data.type === 'DM' && currentTab === 'dms') {
                    if (data.sender_id === currentTarget || (data.sender_id === userId && data.receiver_id === currentTarget)) {
                        return [...prev, data];
                    }
                }
                if (data.type === 'PROJECT' && currentTab === 'projects') {
                    if (data.project_id === currentTarget) {
                        return [...prev, data];
                    }
                }
                return prev;
            });
            if (data.type === 'DM') fetchSidebarData();
        };
        ws.current = socket;
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!activeTarget || !currentUser) return;

        let endpoint = '';
        if (activeTab === 'global') endpoint = '/chat/global/messages';
        else if (activeTab === 'dms') endpoint = `/chat/dm/${activeTarget}/messages`;
        else endpoint = `/chat/${activeTarget}/messages`;

        api.get(endpoint).then(res => setMessages(res.data.reverse())).catch(() => setMessages([]));
    }, [activeTarget, activeTab, currentUser]);

    // --- Actions ---
    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        if (tab === 'global') {
            setActiveTarget('global_room');
            setActiveTargetName('Global Space');
        } else if (tab === 'dms') {
            if (dmList.length > 0) {
                setActiveTarget(dmList[0].user_id);
                setActiveTargetName(dmList[0].name);
            } else {
                setActiveTarget(null);
                setActiveTargetName('No DMs');
            }
        } else {
            if (projects.length > 0) {
                setActiveTarget(projects[0].id);
                setActiveTargetName(projects[0].name);
            } else {
                setActiveTarget(null);
                setActiveTargetName('No Projects');
            }
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim() || !ws.current || !currentUser) return;

        let msgType = 'GLOBAL';
        if (activeTab === 'dms') msgType = 'DM';
        if (activeTab === 'projects') msgType = 'PROJECT';

        const payload = {
            sender_id: currentUser.user_id,
            type: msgType,
            content: chatInput,
            target_id: activeTab === 'global' ? null : activeTarget
        };

        ws.current.send(JSON.stringify(payload));
        setChatInput('');
    };

    return (
        <div className="new-messages-wrapper">
            <style>{`
                /* COMPLETELY NEW UI - NO MORE 3 COLUMNS */
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                .new-messages-wrapper {
                    flex: 1; display: flex; height: calc(100vh - 64px);
                    background: #f4f7fe;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    padding: 24px;
                    gap: 24px;
                }
                
                /* Dark mode support inheriting from body */
                body.dark .new-messages-wrapper { background: #0b1437; }

                /* NEW 2-COLUMN LAYOUT */
                .glass-sidebar {
                    width: 380px; 
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.8);
                    border-radius: 24px;
                    display: flex; flex-direction: column;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.03);
                    overflow: hidden;
                    flex-shrink: 0;
                }
                body.dark .glass-sidebar {
                    background: rgba(17, 28, 68, 0.7);
                    border: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                }

                .glass-chat-area {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.8);
                    border-radius: 24px;
                    display: flex; flex-direction: column;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.03);
                    overflow: hidden;
                }
                body.dark .glass-chat-area {
                    background: rgba(17, 28, 68, 0.8);
                    border: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                }

                /* Pill Navigation */
                .pill-nav {
                    display: flex; padding: 24px; gap: 8px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                body.dark .pill-nav { border-bottom: 1px solid rgba(255,255,255,0.05); }

                .nav-pill {
                    flex: 1; padding: 12px 0; border-radius: 12px;
                    font-weight: 700; font-size: 0.9rem; text-align: center;
                    cursor: pointer; transition: all 0.3s ease;
                    color: #a3aed1; background: transparent;
                }
                body.dark .nav-pill { color: #8f9bba; }
                
                .nav-pill.active {
                    background: linear-gradient(135deg, #4318FF 0%, #868CFF 100%);
                    color: white;
                    box-shadow: 0 10px 20px rgba(67, 24, 255, 0.2);
                }

                /* Sidebar List */
                .sidebar-list { padding: 16px; overflow-y: auto; flex: 1; }
                
                .contact-card {
                    display: flex; align-items: center; padding: 16px;
                    border-radius: 18px; cursor: pointer; margin-bottom: 8px;
                    transition: all 0.2s; border: 1px solid transparent;
                }
                .contact-card:hover { background: rgba(67, 24, 255, 0.05); }
                body.dark .contact-card:hover { background: rgba(255,255,255,0.02); }
                
                .contact-card.active {
                    background: white;
                    border: 1px solid rgba(67, 24, 255, 0.1);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.03);
                }
                body.dark .contact-card.active {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .contact-avatar {
                    width: 48px; height: 48px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.1rem; font-weight: 700; color: white;
                    margin-right: 16px; flex-shrink: 0;
                    background: linear-gradient(135deg, #05CD99 0%, #4318FF 100%);
                }
                .contact-info { flex: 1; min-width: 0; }
                .contact-name { font-weight: 700; font-size: 1.05rem; color: #2B3674; margin-bottom: 4px; }
                body.dark .contact-name { color: white; }
                .contact-msg { font-weight: 500; font-size: 0.85rem; color: #A3AED0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                /* Chat Header */
                .chat-hero-header {
                    padding: 24px 32px; display: flex; align-items: center;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                body.dark .chat-hero-header { border-bottom: 1px solid rgba(255,255,255,0.05); }
                .chat-title { font-size: 1.5rem; font-weight: 800; color: #2B3674; display: flex; align-items: center; gap: 12px; }
                body.dark .chat-title { color: white; }
                
                /* Chat Body */
                .chat-msgs-area { flex: 1; padding: 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
                
                .msg-row { display: flex; max-width: 75%; align-items: flex-end; }
                .msg-row.received { align-self: flex-start; }
                .msg-row.sent { align-self: flex-end; flex-direction: row-reverse; }
                
                .msg-prof {
                    width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; font-weight: 700; color: white; margin: 0 16px; background: #4318FF; flex-shrink: 0;
                }
                .msg-col { display: flex; flex-direction: column; gap: 6px; }
                .msg-row.sent .msg-col { align-items: flex-end; }
                
                .msg-sender-name { font-size: 0.8rem; font-weight: 700; color: #A3AED0; margin-bottom: 2px; }
                
                .msg-box {
                    padding: 16px 20px; font-size: 0.95rem; line-height: 1.6; border-radius: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02); font-weight: 500;
                }
                .msg-row.received .msg-box {
                    background: white; color: #2B3674;
                    border-bottom-left-radius: 4px;
                }
                body.dark .msg-row.received .msg-box { background: rgba(255,255,255,0.05); color: white; }
                
                .msg-row.sent .msg-box {
                    background: linear-gradient(135deg, #4318FF 0%, #868CFF 100%); color: white;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 10px 20px rgba(67, 24, 255, 0.15);
                }

                .mention-tag { color: #4318FF; font-weight: 800; background: rgba(67, 24, 255, 0.1); padding: 2px 8px; border-radius: 6px; }
                body.dark .mention-tag { color: #868CFF; background: rgba(134, 140, 255, 0.2); }

                /* Input Bar */
                .chat-type-area { padding: 24px 32px; }
                .chat-input-pill {
                    display: flex; align-items: center; gap: 16px;
                    background: white; border-radius: 24px; padding: 8px 8px 8px 24px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.05);
                }
                body.dark .chat-input-pill { background: rgba(11, 20, 55, 0.5); border: 1px solid rgba(255,255,255,0.05); }
                
                .chat-input-pill input {
                    flex: 1; background: transparent; border: none; outline: none;
                    font-size: 1rem; font-weight: 500; font-family: 'Plus Jakarta Sans', sans-serif;
                    color: #2B3674;
                }
                body.dark .chat-input-pill input { color: white; }
                
                .btn-send {
                    background: #4318FF; color: white; border: none;
                    width: 48px; height: 48px; border-radius: 18px;
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                    transition: transform 0.2s;
                }
                .btn-send:hover { transform: scale(1.05); }
            `}</style>

            {/* NEW LEFT SIDEBAR - UNIFIED */}
            <div className="glass-sidebar">
                <div className="pill-nav">
                    <div className={`nav-pill ${activeTab === 'global' ? 'active' : ''}`} onClick={() => handleTabSwitch('global')}>
                        🌍 Global
                    </div>
                    <div className={`nav-pill ${activeTab === 'dms' ? 'active' : ''}`} onClick={() => handleTabSwitch('dms')}>
                        💬 DMs
                    </div>
                    <div className={`nav-pill ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleTabSwitch('projects')}>
                        📁 Projects
                    </div>
                </div>

                <div className="sidebar-list">
                    {activeTab === 'global' ? (
                        <div className="contact-card active">
                            <div className="contact-avatar">🌍</div>
                            <div className="contact-info">
                                <div className="contact-name">Global Space</div>
                                <div className="contact-msg">Connect with the world</div>
                            </div>
                        </div>
                    ) : activeTab === 'dms' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A3AED0', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Recent Conversations</div>
                            {(!Array.isArray(dmList) || dmList.length === 0) ? (
                                <div style={{ padding: '8px', color: '#A3AED0', fontSize: '0.9rem' }}>No recent chats. Start one below!</div>
                            ) : (
                                dmList.map(dm => (
                                    <div key={dm.user_id} className={`contact-card ${activeTarget === dm.user_id ? 'active' : ''}`} onClick={() => { setActiveTarget(dm.user_id); setActiveTargetName(dm.name); }}>
                                        <div className="contact-avatar">{dm.avatar_text || (dm.name ? dm.name[0].toUpperCase() : 'U')}</div>
                                        <div className="contact-info">
                                            <div className="contact-name">{dm.name}</div>
                                            <div className="contact-msg">{dm.last_message || 'New conversation'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A3AED0', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '16px' }}>All Users</div>
                            {(!Array.isArray(allUsers) || allUsers.length === 0) ? (
                                <div style={{ padding: '8px', color: '#A3AED0', fontSize: '0.9rem' }}>No other users found.</div>
                            ) : (
                                allUsers.filter(u => !dmList.find(dm => dm.user_id === u.user_id)).map(u => (
                                    <div key={u.user_id} className={`contact-card ${activeTarget === u.user_id ? 'active' : ''}`} onClick={() => { setActiveTarget(u.user_id); setActiveTargetName(u.full_name || u.username); }}>
                                        <div className="contact-avatar">{(u.full_name || u.username || 'U')[0].toUpperCase()}</div>
                                        <div className="contact-info">
                                            <div className="contact-name">{u.full_name || u.username}</div>
                                            <div className="contact-msg">Start chatting...</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        (!Array.isArray(projects) || projects.length === 0) ? (
                            <div style={{ textAlign: 'center', color: '#A3AED0', marginTop: '2rem', fontWeight: 600 }}>
                                No Projects joined yet.
                            </div>
                        ) : (
                            projects.map(proj => (
                                <div
                                    key={proj.id}
                                    className={`contact-card ${activeTarget === proj.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTarget(proj.id);
                                        setActiveTargetName(proj.name);
                                    }}
                                >
                                    <div className="contact-avatar" style={{ background: 'linear-gradient(135deg, #FFB547 0%, #FF7B54 100%)' }}>
                                        {proj.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="contact-info">
                                        <div className="contact-name">{proj.name}</div>
                                        <div className="contact-msg">Team Chat</div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* NEW CHAT AREA */}
            <div className="glass-chat-area">
                <div className="chat-hero-header">
                    <div className="chat-title">
                        {activeTab === 'global' ? '🌍' : activeTab === 'dms' ? '💬' : '📁'} {activeTargetName}
                    </div>
                </div>

                <div className="chat-msgs-area">
                    {(!Array.isArray(messages) || messages.length === 0) ? (
                        <div style={{ textAlign: 'center', color: '#A3AED0', margin: 'auto', fontWeight: 600 }}>
                            This space is quiet. Send the first message!
                        </div>
                    ) : (
                        messages.map(msg => {
                            const isMe = msg.sender_id === currentUser?.user_id;
                            const formatMessage = (text) => {
                                if (!text) return null;
                                return text.split(/(@\w+)/g).map((part, i) =>
                                    part.startsWith('@') ? <span key={i} className="mention-tag">{part}</span> : part
                                );
                            };
                            return (
                                <div key={msg.message_id || Math.random()} className={`msg-row ${isMe ? 'sent' : 'received'}`}>
                                    {!isMe && <div className="msg-prof">{(msg.sender_name || 'U').substring(0, 2).toUpperCase()}</div>}
                                    <div className="msg-col">
                                        {!isMe && <div className="msg-sender-name">{msg.sender_name}</div>}
                                        <div className="msg-box">{formatMessage(msg.content)}</div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-type-area">
                    <div className="chat-input-pill">
                        <input
                            type="text"
                            placeholder="Type something amazing..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button className="btn-send" onClick={handleSendMessage}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2, marginTop: 2 }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;
