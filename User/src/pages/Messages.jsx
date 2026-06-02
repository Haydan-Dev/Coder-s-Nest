import React, { useState } from 'react';

const Messages = () => {
    const [activeChat, setActiveChat] = useState(1);
    
    // Dummy Data
    const contacts = [
        { id: 1, name: "Frontend Team", type: "group", lastMsg: "Looks good, deploy it!", time: "10:42 AM", unread: 0, avatar: "FT" },
        { id: 2, name: "Sarah Lee", type: "dm", lastMsg: "Did you push the latest commits?", time: "09:15 AM", unread: 2, avatar: "SL" },
        { id: 3, name: "Mike Chen", type: "dm", lastMsg: "Thanks for the help yesterday.", time: "Yesterday", unread: 0, avatar: "MC" },
        { id: 4, name: "API Discussion", type: "group", lastMsg: "Endpoint is up.", time: "Yesterday", unread: 0, avatar: "AD" }
    ];

    const messages = [
        { id: 1, senderId: 2, senderName: "Sarah Lee", text: "Hey! How's the new chat feature coming along?", time: "10:00 AM", isMe: false },
        { id: 2, senderId: 'me', senderName: "You", text: "Almost done! Just hooking up the UI.", time: "10:05 AM", isMe: true },
        { id: 3, senderId: 2, senderName: "Sarah Lee", text: "Awesome, can't wait to test it.", time: "10:06 AM", isMe: false },
        { id: 4, senderId: 'me', senderName: "You", text: "I'll let you know once it's merged.", time: "10:10 AM", isMe: true },
    ];

    return (
        <div className="messages-container">
            <style>{`
                .messages-container {
                    flex: 1;
                    display: flex;
                    min-height: 0;
                    background: var(--bg-page);
                }
                
                /* Left Sidebar (Contacts) */
                .chat-sidebar {
                    width: 320px;
                    border-right: 1px solid var(--border);
                    background: var(--bg-sidebar);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }
                .chat-sidebar-header {
                    padding: 20px;
                    border-bottom: 1px solid var(--border);
                }
                .chat-sidebar-header h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 16px;
                }
                .chat-search {
                    width: 100%;
                    padding: 10px 16px;
                    background: var(--bg-hover);
                    border: 1px solid transparent;
                    border-radius: var(--r-md);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    outline: none;
                    transition: border 0.2s;
                }
                .chat-search:focus {
                    border-color: var(--accent);
                }
                .contact-list {
                    flex: 1;
                    overflow-y: auto;
                }
                .contact-item {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .contact-item:hover {
                    background: var(--bg-hover);
                }
                .contact-item.active {
                    background: var(--bg-active);
                }
                .contact-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--r-full);
                    background: linear-gradient(135deg, var(--accent), #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    margin-right: 16px;
                    flex-shrink: 0;
                }
                .contact-item:nth-child(even) .contact-avatar {
                    background: linear-gradient(135deg, #10b981, #059669);
                }
                .contact-info {
                    flex: 1;
                    min-width: 0;
                }
                .contact-top {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .contact-name {
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .contact-time {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .contact-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .contact-last-msg {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .unread-badge {
                    background: var(--accent);
                    color: white;
                    font-size: 0.75rem;
                    font-weight: bold;
                    padding: 2px 8px;
                    border-radius: var(--r-full);
                }

                /* Right Window (Chat) */
                .chat-window {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-card);
                    min-width: 0;
                }
                .chat-header {
                    height: 70px;
                    padding: 0 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .chat-header-info {
                    display: flex;
                    align-items: center;
                }
                .chat-header-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: var(--r-full);
                    background: linear-gradient(135deg, var(--accent), #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    margin-right: 12px;
                }
                .chat-header-name {
                    font-weight: 600;
                    font-size: 1.1rem;
                }
                .chat-header-status {
                    font-size: 0.8rem;
                    color: var(--success);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .chat-header-status::before {
                    content: '';
                    display: block;
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                }
                .chat-header-actions {
                    display: flex;
                    gap: 16px;
                }
                .chat-action-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: var(--r-md);
                    transition: 0.2s;
                }
                .chat-action-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                /* History */
                .chat-history {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .msg-wrapper {
                    display: flex;
                    max-width: 70%;
                }
                .msg-wrapper.received {
                    align-self: flex-start;
                }
                .msg-wrapper.sent {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }
                .msg-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--r-full);
                    background: var(--bg-hover);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    margin: 0 12px;
                    margin-top: auto;
                    flex-shrink: 0;
                }
                .msg-bubble {
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 0.95rem;
                    line-height: 1.4;
                    position: relative;
                }
                .msg-wrapper.received .msg-bubble {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                    border-bottom-left-radius: 4px;
                }
                .msg-wrapper.sent .msg-bubble {
                    background: var(--accent);
                    color: var(--accent-text);
                    border-bottom-right-radius: 4px;
                }
                .msg-time {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    margin-top: 4px;
                    text-align: right;
                }
                .msg-wrapper.received .msg-time {
                    text-align: left;
                }

                /* Input Area */
                .chat-input-area {
                    padding: 20px 24px;
                    border-top: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .chat-attach-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: var(--r-full);
                    transition: 0.2s;
                }
                .chat-attach-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
                .chat-input-box {
                    flex: 1;
                    padding: 12px 20px;
                    border: 1px solid var(--border);
                    border-radius: var(--r-full);
                    background: var(--bg-input);
                    color: var(--text-primary);
                    outline: none;
                    font-size: 0.95rem;
                }
                .chat-input-box:focus {
                    border-color: var(--accent);
                }
                .chat-send-btn {
                    background: var(--accent);
                    color: var(--accent-text);
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: var(--r-full);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .chat-send-btn:hover {
                    background: var(--accent-hover);
                    transform: scale(1.05);
                }
            `}</style>

            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h2>Messages</h2>
                    <input type="text" className="chat-search" placeholder="Search chats..." />
                </div>
                <div className="contact-list">
                    {contacts.map(contact => (
                        <div 
                            key={contact.id} 
                            className={`contact-item ${activeChat === contact.id ? 'active' : ''}`}
                            onClick={() => setActiveChat(contact.id)}
                        >
                            <div className="contact-avatar">{contact.avatar}</div>
                            <div className="contact-info">
                                <div className="contact-top">
                                    <div className="contact-name">{contact.name}</div>
                                    <div className="contact-time">{contact.time}</div>
                                </div>
                                <div className="contact-bottom">
                                    <div className="contact-last-msg">{contact.lastMsg}</div>
                                    {contact.unread > 0 && <div className="unread-badge">{contact.unread}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-header-avatar">SL</div>
                        <div>
                            <div className="chat-header-name">Sarah Lee</div>
                            <div className="chat-header-status">Online</div>
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button className="chat-action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </button>
                        <button className="chat-action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        </button>
                    </div>
                </div>

                <div className="chat-history">
                    {messages.map(msg => (
                        <div key={msg.id} className={`msg-wrapper ${msg.isMe ? 'sent' : 'received'}`}>
                            {!msg.isMe && <div className="msg-avatar">SL</div>}
                            <div>
                                <div className="msg-bubble">{msg.text}</div>
                                <div className="msg-time">{msg.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chat-input-area">
                    <button className="chat-attach-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    <input type="text" className="chat-input-box" placeholder="Type a message..." />
                    <button className="chat-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Messages;
