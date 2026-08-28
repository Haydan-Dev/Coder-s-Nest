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
    const [contextMenu, setContextMenu] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);

    // Unread Messages State
    const [unreadCounts, setUnreadCounts] = useState(() => {
        const saved = localStorage.getItem('chat_unread_counts');
        return saved ? JSON.parse(saved) : { global: 0, projects: {} };
    });
    useEffect(() => {
        localStorage.setItem('chat_unread_counts', JSON.stringify(unreadCounts));
    }, [unreadCounts]);

    const totalUnreadDMs = dmList ? dmList.reduce((acc, dm) => acc + (dm.unread_count || 0), 0) : 0;
    const totalUnreadProjects = Object.values(unreadCounts.projects).reduce((a, b) => a + b, 0);
    const totalUnreadAll = unreadCounts.global + totalUnreadDMs + totalUnreadProjects;

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('update_messages_count', { detail: totalUnreadAll }));
    }, [totalUnreadAll]);

    useEffect(() => {
        // Global click listener removed in favor of overlay backdrop to fix race condition for Copy
    }, []);

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
            const currentTab = activeTabRef.current;
            const currentTarget = activeTargetRef.current;

            if (data.type === 'DELETE_MESSAGE') {
                const currentTarget = activeTargetRef.current;
                const currentTab = activeTabRef.current;
                let isCurrentContext = false;
                if (data.is_dm && currentTab === 'dms' && (String(data.target_id) === String(currentTarget) || String(data.sender_id) === String(currentTarget))) isCurrentContext = true;
                else if (!data.is_dm && currentTab === 'projects' && String(data.target_id) === String(currentTarget)) isCurrentContext = true;
                
                if (isCurrentContext) {
                    setMessages(prev => prev.map(m => m.message_id === data.message_id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
                }
                return;
            }

            let isCurrentWindow = false;
            if (data.type === 'GLOBAL' && currentTab === 'global') isCurrentWindow = true;
            else if (data.type === 'DM' && currentTab === 'dms') {
                if (String(data.sender_id) === String(currentTarget) || (data.sender_id === userId && String(data.receiver_id) === String(currentTarget))) isCurrentWindow = true;
            } else if (data.type === 'PROJECT' && currentTab === 'projects') {
                if (String(data.project_id) === String(currentTarget)) isCurrentWindow = true;
            }

            if (isCurrentWindow) {
                setMessages(prev => [...prev, data]);
                if (data.type === 'DM') fetchSidebarData();
            } else {
                // If NOT the current window, increment the unread count!
                setUnreadCounts(prev => {
                    const newCounts = { ...prev, projects: { ...prev.projects } };
                    if (data.type === 'GLOBAL') newCounts.global += 1;
                    else if (data.type === 'PROJECT') {
                        newCounts.projects[data.project_id] = (newCounts.projects[data.project_id] || 0) + 1;
                    }
                    return newCounts;
                });
                if (data.type === 'DM') fetchSidebarData();
            }
        };
        ws.current = socket;
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!activeTarget || !currentUser) return;

        if (activeTab === 'global') {
            setMessages([]);
            return;
        }

        let endpoint = '';
        if (activeTab === 'dms') endpoint = `/chat/dm/${activeTarget}/messages`;
        else endpoint = `/chat/${activeTarget}/messages`;

        api.get(endpoint).then(res => {
            const sorted = res.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            setMessages(sorted);
        }).catch(() => setMessages([]))
          .finally(() => {
              // Now that messages are fetched (and marked as read on backend for DMs), refetch sidebar
              if (activeTab === 'dms') {
                  fetchSidebarData();
              }
          });
    }, [activeTarget, activeTab, currentUser]);

    // Reset local unread count when opening a target
    useEffect(() => {
        if (activeTab === 'global') {
            setUnreadCounts(prev => ({ ...prev, global: 0 }));
        } else if (activeTab === 'projects' && activeTarget) {
            setUnreadCounts(prev => ({ ...prev, projects: { ...prev.projects, [activeTarget]: 0 } }));
        }
    }, [activeTab, activeTarget]);

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
        if (!chatInput.trim() || !activeTarget) return;

        const payload = {
            content: chatInput,
            sender_id: currentUser.user_id,
            message_type: 'Text',
            reply_to_message_id: replyingTo ? replyingTo.message_id : null
        };

        if (activeTab === 'dms') {
            payload.receiver_id = activeTarget;
        } else if (activeTab === 'projects') {
            payload.project_id = activeTarget;
        }

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(payload));
            setChatInput('');
            setReplyingTo(null);
        }
    };

    const handleDelete = async (msg) => {
        if (String(msg.sender_id) !== String(currentUser.user_id)) {
            alert("You can only delete your own messages!");
            setContextMenu(null);
            return;
        }
        
        try {
            const endpoint = activeTab === 'dms' ? `/chat/dm/${msg.message_id}` : `/chat/project/${msg.message_id}`;
            await api.delete(endpoint);
            
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'DELETE_MESSAGE',
                    message_id: msg.message_id,
                    target_id: activeTarget,
                    is_dm: activeTab === 'dms',
                    sender_id: currentUser.user_id
                }));
            }
            
            setMessages(prev => prev.map(m => m.message_id === msg.message_id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
            setContextMenu(null);
        } catch (err) {
            console.error("Failed to delete message", err);
            alert("Failed to delete message");
            setContextMenu(null);
        }
    };

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            msg: msg
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        let hours = d.getHours();
        let mins = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        mins = mins < 10 ? '0' + mins : mins;
        return `${hours}:${mins} ${ampm}`;
    };

    return (
        <div className="new-messages-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                :root { --primary: #4318FF; }
                .new-messages-wrapper {
                    flex: 1; display: flex; height: calc(100vh - 64px);
                    background: #f4f7fe;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    padding: 24px;
                    gap: 24px;
                }
                body.dark .new-messages-wrapper { background: #0b1437; }
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
                }
                .pill-nav {
                    display: flex; padding: 24px; gap: 8px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .nav-pill {
                    flex: 1; padding: 12px 0; border-radius: 12px;
                    font-weight: 700; font-size: 0.9rem; text-align: center;
                    cursor: pointer; transition: all 0.3s ease;
                    color: #a3aed1; background: transparent;
                }
                .nav-pill.active {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 10px 20px rgba(67, 24, 255, 0.2);
                }
                .sidebar-list { padding: 16px; overflow-y: auto; flex: 1; }
                .contact-card {
                    display: flex; align-items: center; padding: 16px;
                    border-radius: 18px; cursor: pointer; margin-bottom: 8px;
                    transition: all 0.2s; border: 1px solid transparent;
                }
                .contact-card:hover { background: rgba(67, 24, 255, 0.05); }
                .contact-card.active {
                    background: white;
                    border: 1px solid rgba(67, 24, 255, 0.1);
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
                .contact-name { font-weight: 700; font-size: 1.05rem; color: #2B3674; }
                body.dark .contact-name { color: white; }
                .contact-msg { font-weight: 500; font-size: 0.85rem; color: #A3AED0; }
                .unread-badge {
                    background: #ef4444; color: white; font-size: 0.75rem; font-weight: 700;
                    padding: 2px 8px; border-radius: 10px;
                }
                .chat-hero-header {
                    padding: 24px 32px; display: flex; align-items: center;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .chat-title { font-size: 1.5rem; font-weight: 800; color: #2B3674; }
                body.dark .chat-title { color: white; }
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
                .msg-sender-name { font-size: 0.75rem; color: #A3AED0; margin-bottom: 4px; font-weight: 600; padding-left: 4px; }
                
                .msg-box {
                    position: relative;
                    padding: 10px 14px 22px 14px;
                    border-radius: 16px;
                    font-size: 0.95rem; line-height: 1.5;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    min-width: 90px;
                }
                
                .msg-row.received .msg-box {
                    background: white; color: #2B3674;
                    border-bottom-left-radius: 4px;
                }
                body.dark .msg-row.received .msg-box { background: rgba(255,255,255,0.08); color: white; }
                
                .msg-row.sent .msg-box {
                    background: linear-gradient(135deg, #4318FF 0%, #868CFF 100%); color: white;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 10px 20px rgba(67, 24, 255, 0.2);
                }

                .msg-time {
                    position: absolute; bottom: 6px; right: 10px;
                    font-size: 0.65rem; font-weight: 500;
                    color: rgba(0,0,0,0.4);
                }
                body.dark .msg-time { color: rgba(255,255,255,0.4); }
                .msg-row.sent .msg-time { color: rgba(255,255,255,0.7); }

                .msg-text { margin-bottom: 2px; word-break: break-word; }
                
                .msg-reply-box {
                    background: rgba(0,0,0,0.05);
                    border-left: 3px solid rgba(0,0,0,0.2);
                    padding: 6px 10px;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                .msg-row.sent .msg-reply-box {
                    background: rgba(255,255,255,0.1);
                    border-left: 3px solid rgba(255,255,255,0.4);
                }

                .mention-tag { color: #4318FF; font-weight: 800; background: rgba(67, 24, 255, 0.1); padding: 2px 8px; border-radius: 6px; }
                body.dark .mention-tag { color: #868CFF; background: rgba(134, 140, 255, 0.2); }

                .chat-context-menu {
                    position: fixed; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15); padding: 8px; min-width: 180px; z-index: 9999; 
                    font-size: 0.9rem; font-family: 'Plus Jakarta Sans', sans-serif;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    transform-origin: top left;
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                body.dark .chat-context-menu {
                    background: rgba(17, 28, 68, 0.85); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }
                .context-item { 
                    padding: 10px 14px; cursor: pointer; color: #2B3674; font-weight: 600;
                    display: flex; align-items: center; gap: 12px; border-radius: 8px; transition: all 0.2s ease;
                }
                body.dark .context-item { color: #fff; }
                .context-item:hover { background: rgba(67, 24, 255, 0.1); color: var(--primary); }
                body.dark .context-item:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
                .context-item.delete { color: #ef4444; }
                .context-item.delete:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                /* Input Bar */
                .chat-type-area { padding: 16px 32px; display: flex; flex-direction: column; }
                
                .reply-preview-banner {
                    background: rgba(67, 24, 255, 0.05);
                    padding: 10px 16px; border-radius: 12px;
                    border-left: 4px solid var(--primary);
                    margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;
                }
                body.dark .reply-preview-banner { background: rgba(255,255,255,0.05); }

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
                        🌍 Global {unreadCounts.global > 0 && <span className="unread-badge pill-badge">{unreadCounts.global}</span>}
                    </div>
                    <div className={`nav-pill ${activeTab === 'dms' ? 'active' : ''}`} onClick={() => handleTabSwitch('dms')}>
                        💬 DMs {totalUnreadDMs > 0 && <span className="unread-badge pill-badge">{totalUnreadDMs}</span>}
                    </div>
                    <div className={`nav-pill ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleTabSwitch('projects')}>
                        📁 Projects {totalUnreadProjects > 0 && <span className="unread-badge pill-badge">{totalUnreadProjects}</span>}
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
                            {unreadCounts.global > 0 && <div className="unread-badge">{unreadCounts.global}</div>}
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
                                        {dm.unread_count > 0 && <div className="unread-badge">{dm.unread_count}</div>}
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
                                    {unreadCounts.projects[proj.id] > 0 && <div className="unread-badge">{unreadCounts.projects[proj.id]}</div>}
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
                            const isMe = String(msg.sender_id) === String(currentUser?.user_id);
                            const formatMessageText = (text) => {
                                if (!text) return null;
                                return text.split(/(@\w+)/g).map((part, i) =>
                                    part.startsWith('@') ? <span key={i} className="mention-tag">{part}</span> : part
                                );
                            };
                            
                            const repliedMsg = msg.reply_to_message_id ? messages.find(m => m.message_id === msg.reply_to_message_id) : null;

                            return (
                                <div key={msg.message_id || Math.random()} className={`msg-row ${isMe ? 'sent' : 'received'}`} onContextMenu={(e) => handleContextMenu(e, msg)}>
                                    {!isMe && <div className="msg-prof">{(msg.sender_name || 'U').substring(0, 2).toUpperCase()}</div>}
                                    <div className="msg-col">
                                        {!isMe && <div className="msg-sender-name">{msg.sender_name}</div>}
                                        <div className="msg-box" style={{ opacity: msg.is_deleted ? 0.7 : 1 }}>
                                            {repliedMsg && (
                                                <div className="msg-reply-box" onClick={() => {
                                                    // Optional: scroll to replied message
                                                    // For now it just displays it beautifully
                                                }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '2px', color: isMe ? 'white' : 'var(--primary)' }}>{repliedMsg.sender_name || 'User'}</div>
                                                    <div style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                        {repliedMsg.is_deleted ? '🚫 This message was deleted' : repliedMsg.content}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="msg-text" style={{ fontStyle: msg.is_deleted ? 'italic' : 'normal' }}>
                                                {msg.is_deleted ? '🚫 This message was deleted' : formatMessageText(msg.content)}
                                            </div>
                                            <div className="msg-time">{formatTime(msg.created_at)}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-type-area">
                    {replyingTo && (
                        <div className="reply-preview-banner">
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>Replying to {replyingTo.sender_name || 'User'}</div>
                                <div style={{ fontSize: '0.85rem', color: '#2B3674', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                    {replyingTo.is_deleted ? '🚫 This message was deleted' : replyingTo.content}
                                </div>
                            </div>
                            <div style={{ cursor: 'pointer', padding: '4px', opacity: 0.6 }} onClick={() => setReplyingTo(null)}>✖</div>
                        </div>
                    )}
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
            {contextMenu && (
                <>
                    <div onClick={() => setContextMenu(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} />
                    <div className="chat-context-menu" style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}>
                        <div className="context-item" onClick={() => {
                            navigator.clipboard.writeText(contextMenu.msg.content);
                            setContextMenu(null);
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copy Text
                        </div>
                        <div className="context-item" onClick={() => { 
                            setReplyingTo(contextMenu.msg);
                            setContextMenu(null);
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                            Reply
                        </div>
                        <div className="context-item delete" onClick={() => handleDelete(contextMenu.msg)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            Delete
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Messages;
