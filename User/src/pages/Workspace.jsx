import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

// ============================================================
// INITIAL DATA
// ============================================================
const initialFileTree = [
    {
        id: 'src', name: 'src', type: 'folder', open: true, children: [
            { id: 'index.ts', name: 'index.ts', type: 'file', lang: 'TypeScript', modified: false },
            { id: 'auth.ts', name: 'auth.ts', type: 'file', lang: 'TypeScript', modified: true },
            { id: 'routes.ts', name: 'routes.ts', type: 'file', lang: 'TypeScript', modified: false },
            {
                id: 'middleware', name: 'middleware', type: 'folder', open: true, children: [
                    { id: 'rateLimiter.ts', name: 'rateLimiter.ts', type: 'file', lang: 'TypeScript', modified: false },
                    { id: 'cors.ts', name: 'cors.ts', type: 'file', lang: 'TypeScript', modified: false },
                ]
            },
            {
                id: 'utils', name: 'utils', type: 'folder', open: false, children: [
                    { id: 'logger.ts', name: 'logger.ts', type: 'file', lang: 'TypeScript', modified: false },
                    { id: 'helpers.ts', name: 'helpers.ts', type: 'file', lang: 'TypeScript', modified: false },
                ]
            },
        ]
    },
    {
        id: 'tests', name: 'tests', type: 'folder', open: false, children: [
            { id: 'auth.test.ts', name: 'auth.test.ts', type: 'file', lang: 'TypeScript', modified: false },
            { id: 'routes.test.ts', name: 'routes.test.ts', type: 'file', lang: 'TypeScript', modified: false },
        ]
    },
    { id: 'package.json', name: 'package.json', type: 'file', lang: 'JSON', modified: false },
    { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', lang: 'JSON', modified: false },
    { id: '.env', name: '.env', type: 'file', lang: 'ENV', modified: false },
    { id: 'README.md', name: 'README.md', type: 'file', lang: 'Markdown', modified: false },
];

const initialFileContents = {
    'index.ts': `import express from 'express';\nimport { router } from './routes';\n\nconst app = express();\napp.listen(3000);\n`,
    'auth.ts': `export function authMiddleware(req, res, next) {\n  next();\n}\n`,
    'package.json': `{\n  "name": "nest-api-gateway",\n  "version": "1.0.0"\n}\n`
};

const getFileIcon = (name) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return <svg viewBox="0 0 24 24" fill="#3178c6" width="14" height="14"><rect x="2" y="2" width="20" height="20" rx="3" /><path fill="#fff" d="M14.5 12.5h2v6h-2v-4.5l-1.5 2.5-1.5-2.5V18.5h-2v-6h2l1.5 2.5 1.5-2.5zm-7 1.5H6v-1.5h5v1.5H9.5V18.5h-2V14z" /></svg>;
    if (name.endsWith('.json')) return <svg viewBox="0 0 24 24" fill="#f59e0b" width="14" height="14"><text x="2" y="18" fontSize="14" fontWeight="bold" fontFamily="monospace">{`{}`}</text></svg>;
    if (name.endsWith('.md')) return <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    if (name === '.env') return <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const Workspace = () => {
    const { projectId } = useParams();
    const [workspaceData, setWorkspaceData] = useState(null);
    const [fileTree, setFileTree] = useState([]);
    const [fileContents, setFileContents] = useState({});
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [explorerOpen, setExplorerOpen] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchWorkspace();
        } else {
            // Blank VS Code state when no project is open
            setFileTree([]);
            setFileContents({});
            setOpenTabs([]);
            setActiveTab(null);
        }
    }, [projectId]);

    const getLanguageFromExtension = (filename) => {
        if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'TypeScript';
        if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'JavaScript';
        if (filename.endsWith('.py')) return 'Python';
        if (filename.endsWith('.json')) return 'JSON';
        if (filename.endsWith('.md')) return 'Markdown';
        if (filename === '.env') return 'ENV';
        return 'Other';
    };

    const transformFolderToUI = (folder) => {
        const subfolders = (folder.subfolders || []).map(transformFolderToUI);
        const files = (folder.files || []).map(f => ({
            id: String(f.file_id),
            name: f.file_name,
            type: 'file',
            lang: getLanguageFromExtension(f.file_name),
            modified: false
        }));
        
        return {
            id: 'folder_' + folder.folder_id,
            name: folder.folder_name,
            type: 'folder',
            open: folder.folder_name === 'root',
            children: [...subfolders, ...files]
        };
    };

    const fetchWorkspace = async () => {
        try {
            const res = await api.get(`/workspaces/project/${projectId}`);
            setWorkspaceData(res.data);
            if (res.data && res.data.folders) {
                const uiTree = res.data.folders.map(transformFolderToUI);
                setFileTree(uiTree);
            }
        } catch (err) {
            console.error('Failed to fetch workspace', err);
            setFileTree([]);
        }
    };

    // Chat State
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'Sarah K.', initial: 'SK', color: '#10b981', time: '10:14 am', text: 'Just pushed the auth middleware — can someone review?' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // AI State
    const [aiMessages, setAiMessages] = useState([
        { id: 1, sender: 'AI', text: 'Hello! I am your AI coding assistant. I can help explain code, write tests, or find bugs. How can I help?' }
    ]);
    const [aiInput, setAiInput] = useState('');

    // Layout States
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [activeRightView, setActiveRightView] = useState('chat'); // 'chat' | 'ai'

    // Editor State
    const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });

    // Context Menu & Modals State
    const [ctxMenu, setCtxMenu] = useState({ isOpen: false, x: 0, y: 0, targetId: null });
    const [newItemModal, setNewItemModal] = useState({ isOpen: false, type: 'file', parentId: null, name: '' });
    const [renamingId, setRenamingId] = useState(null);
    const [renameInput, setRenameInput] = useState('');

    const chatEndRef = useRef(null);

    // --- Helpers for Deep State Updates ---
    const updateTreeRecursively = (nodes, id, updater) => {
        return nodes.map(node => {
            if (node.id === id) return updater(node);
            if (node.children) return { ...node, children: updateTreeRecursively(node.children, id, updater) };
            return node;
        });
    };

    const findNode = (nodes, id) => {
        for (const n of nodes) {
            if (n.id === id) return n;
            if (n.children) {
                const found = findNode(n.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // --- File Actions ---
    const handleOpenFile = (id) => {
        if (!openTabs.includes(id)) setOpenTabs([...openTabs, id]);
        setActiveTab(id);
        if (!fileContents[id]) {
            setFileContents(prev => ({ ...prev, [id]: `// ${id}\n// Start coding here...` }));
        }
    };

    const handleCloseTab = (e, id) => {
        e.stopPropagation();
        const newTabs = openTabs.filter(t => t !== id);
        setOpenTabs(newTabs);
        if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1] || null);
    };

    const handleToggleFolder = (id) => {
        setFileTree(prev => updateTreeRecursively(prev, id, node => ({ ...node, open: !node.open })));
    };

    const handleEditorChange = (e) => {
        const val = e.target.value;
        setFileContents(prev => ({ ...prev, [activeTab]: val }));
        setFileTree(prev => updateTreeRecursively(prev, activeTab, node => ({ ...node, modified: true })));
        updateCursor(e);
    };

    const updateCursor = (e) => {
        const ta = e.target;
        const textBefore = ta.value.substring(0, ta.selectionStart);
        const lines = textBefore.split('\n');
        setCursorPos({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
    };

    const saveFile = () => {
        if (!activeTab) return;
        setFileTree(prev => updateTreeRecursively(prev, activeTab, node => ({ ...node, modified: false })));
        console.log(`Saved ${activeTab}`);
    };

    // --- Context Menu Actions ---
    const openCtxMenu = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ isOpen: true, x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 160), targetId: id });
    };

    const closeCtxMenu = () => setCtxMenu(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        document.addEventListener('click', closeCtxMenu);
        return () => document.removeEventListener('click', closeCtxMenu);
    }, []);

    const handleCreateItemSubmit = async () => {
        if (!newItemModal.name.trim() || !workspaceData) return;
        
        // Determine the parent folder ID
        let targetFolderId = workspaceData.folders[0]?.folder_id; // Default to root
        if (newItemModal.parentId && newItemModal.parentId.startsWith('folder_')) {
            targetFolderId = parseInt(newItemModal.parentId.replace('folder_', ''));
        }

        try {
            if (newItemModal.type === 'file') {
                const extIndex = newItemModal.name.lastIndexOf('.');
                const extension = extIndex > -1 ? newItemModal.name.substring(extIndex) : '.txt';
                
                await api.post('/files/', {
                    workspace_id: workspaceData.workspace_id,
                    folder_id: targetFolderId,
                    file_name: newItemModal.name.trim(),
                    file_extension: extension,
                    mime_type: 'text/plain',
                    file_content: ''
                });
            } else {
                await api.post('/folders/', {
                    workspace_id: workspaceData.workspace_id,
                    parent_folder_id: targetFolderId,
                    folder_name: newItemModal.name.trim()
                });
            }
            
            // Refresh tree
            setNewItemModal({ isOpen: false, type: 'file', parentId: null, name: '' });
            fetchWorkspace();
            
        } catch (err) {
            console.error('Failed to create item', err);
            alert(err.response?.data?.detail || 'Failed to create item');
        }
    };

    // --- Chat & AI Actions ---
    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages([...chatMessages, { id: Date.now(), sender: 'You', initial: 'JD', color: '#2563eb', time, text: chatInput }]);
        setChatInput('');
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSendAi = () => {
        if (!aiInput.trim()) return;
        setAiMessages(prev => [...prev, { id: Date.now(), sender: 'You', text: aiInput }]);
        setAiInput('');
        setTimeout(() => {
            setAiMessages(prev => [...prev, { id: Date.now(), sender: 'AI', text: 'I am currently a UI prototype, but soon I will be connected to a powerful LLM to answer your questions in real-time!' }]);
        }, 600);
    };

    // ============================================================
    // RECURSIVE TREE NODE COMPONENT
    // ============================================================
    const TreeNode = ({ node, depth }) => {
        const indent = depth * 14;
        const isEditing = renamingId === node.id;

        if (node.type === 'folder') {
            return (
                <div>
                    <div className="tree-item" style={{ paddingLeft: `${8 + indent}px` }} onContextMenu={(e) => openCtxMenu(e, node.id)} onClick={() => handleToggleFolder(node.id)}>
                        <div className={`tree-chevron ${node.open ? 'open' : ''}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                        <div className="tree-file-icon">
                            <svg viewBox="0 0 24 24" fill={node.open ? '#f59e0b' : 'none'} stroke={node.open ? '#f59e0b' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        </div>
                        <span className="tree-label">{node.name}</span>
                    </div>
                    {node.open && <div>{node.children.map(child => <TreeNode key={child.id} node={child} depth={depth + 1} />)}</div>}
                </div>
            );
        }

        return (
            <div className={`tree-item ${activeTab === node.id ? 'active' : ''}`} style={{ paddingLeft: `${8 + 16 + indent}px` }} onClick={() => handleOpenFile(node.id)} onContextMenu={(e) => openCtxMenu(e, node.id)}>
                <div className="tree-file-icon">{getFileIcon(node.name)}</div>
                {isEditing ? (
                    <input className="tree-rename-input" autoFocus value={renameInput} onChange={(e) => setRenameInput(e.target.value)} onBlur={() => setRenamingId(null)} onKeyDown={(e) => e.key === 'Enter' && setRenamingId(null)} />
                ) : (
                    <span className="tree-label">{node.name} {node.modified && <span style={{ color: '#f59e0b' }}>●</span>}</span>
                )}
            </div>
        );
    };

    const activeNode = findNode(fileTree, activeTab);
    const codeLines = fileContents[activeTab]?.split('\n').length || 1;

    return (
        <div className="workspace-page">
            <style>{`
                /* WORKSPACE PAGE LAYOUT */
                .workspace-page { display: flex; flex-direction: column; height: 100%; width: 100%; overflow: hidden; background: var(--bg-main); color: var(--text-primary); font-family: var(--font-sans); }
                .ws-root { display: flex; flex-direction: column; height: 100%; flex: 1; min-height: 0; }
                
                /* TOP BAR */
                .ws-topbar { height: 40px; min-height: 40px; background: var(--bg-card); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; gap: 12px; font-size: 0.85rem; }
                .ws-logo-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: var(--accent); background: var(--accent-light); border-radius: var(--r-sm); }
                .ws-divider { width: 1px; height: 20px; background: var(--border); }
                .ws-proj-name { font-weight: 700; color: var(--text-primary); font-size: 0.85rem; }
                .ws-breadcrumb { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); flex: 1; }
                .ws-breadcrumb svg { width: 16px; height: 16px; opacity: 0.4; }
                .ws-breadcrumb-item { cursor: pointer; transition: color 0.2s; font-weight: 500; }
                .ws-breadcrumb-item:hover { color: var(--text-primary); }
                .ws-topbar-right { display: flex; align-items: center; gap: 16px; margin-left: auto; }
                .ws-status-dot { width: 10px; height: 10px; background: var(--success); border-radius: 50%; box-shadow: 0 0 12px rgba(16,185,129,0.5); }
                .ws-topbar-btn { background: var(--bg-main); border: 1.5px solid var(--border); padding: 8px 16px; border-radius: var(--r-md); color: var(--text-primary); font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .ws-topbar-btn:hover { background: var(--bg-hover); border-color: var(--border-hover); transform: translateY(-1px); }
                .ws-topbar-btn.primary { background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
                .ws-topbar-btn.primary:hover { box-shadow: 0 6px 16px rgba(37,99,235,0.4); transform: translateY(-2px); }

                /* BODY LAYOUT */
                .ws-body { display: flex; flex: 1; min-height: 0; overflow: hidden; background: var(--bg-main); }
                
                /* FILE EXPLORER */
                .file-explorer { width: 260px; min-width: 260px; background: var(--bg-card); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
                .file-explorer.collapsed { width: 0; min-width: 0; border: none; opacity: 0; }
                .explorer-header { padding: 10px 16px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); opacity: 0.8; display: flex; align-items: center; justify-content: space-between; }
                .explorer-actions { display: flex; gap: 8px; opacity: 0; transition: 0.2s; }
                .file-explorer:hover .explorer-actions { opacity: 1; }
                .explorer-action-btn { cursor: pointer; color: var(--text-muted); transition: 0.2s; }
                .explorer-action-btn:hover { color: var(--accent); }
                .explorer-tree { flex: 1; overflow-y: auto; padding: 0 0 12px 0; }
                .tree-item { display: flex; align-items: center; padding: 4px 16px 4px 4px; gap: 6px; cursor: pointer; user-select: none; color: var(--text-secondary); font-size: 0.8rem; border-left: 2px solid transparent; }
                .tree-item:hover { background: var(--bg-hover); color: var(--text-primary); }
                .tree-item.active { background: var(--accent-light); color: var(--accent); font-weight: 500; border-left-color: var(--accent); }
                .tree-chevron { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; opacity: 0.5; }
                .tree-chevron.open { transform: rotate(90deg); opacity: 1; }
                .tree-file-icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; }
                .tree-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
                .tree-rename-input { flex: 1; background: var(--bg-main); border: 1.5px solid var(--accent); color: var(--text-primary); font-size: 0.85rem; padding: 4px 8px; border-radius: var(--r-sm); outline: none; width: 100%; box-sizing: border-box; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

                /* EDITOR */
                .editor-container { flex: 1; display: flex; flex-direction: column; background: var(--bg-main); min-width: 0; }
                
                /* TAB BAR */
                .tab-bar { display: flex; background: var(--bg-card); border-bottom: 1px solid var(--border); overflow-x: auto; height: 36px; min-height: 36px; align-items: flex-end; }
                .tab-bar::-webkit-scrollbar { height: 0px; }
                .editor-tab { display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 36px; border-right: 1px solid var(--border); border-top: 2px solid transparent; font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; user-select: none; min-width: max-content; background: var(--bg-card); position: relative; margin-left: 0; }
                .editor-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
                .editor-tab.active { background: var(--bg-main); color: var(--accent); border-top-color: var(--accent); border-right-color: var(--border); border-left: none; box-shadow: none; z-index: 2; margin-left: 0; }
                .editor-tab.active::after { display: none; }
                .tab-dot { width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; box-shadow: 0 0 6px rgba(245,158,11,0.5); }
                .tab-close { opacity: 0; border: none; background: none; color: var(--text-secondary); cursor: pointer; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: var(--r-sm); transition: all 0.2s; margin-right: -8px; }
                .editor-tab:hover .tab-close, .editor-tab.active .tab-close { opacity: 1; }
                .tab-close:hover { background: rgba(0,0,0,0.1); color: #ef4444; }

                /* EDITOR AREA */
                .editor-wrap { display: flex; flex: 1; overflow: hidden; background: var(--bg-main); }
                .line-numbers { width: 48px; min-width: 48px; background: var(--bg-main); border-right: 1px solid rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: flex-end; padding: 10px 12px 10px 0; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); user-select: none; overflow: hidden; line-height: 1.6; }
                .editor-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .code-editor { flex: 1; background: transparent; border: none; outline: none; padding: 10px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-primary); line-height: 1.6; resize: none; overflow: auto; white-space: pre; }
                .code-editor::-webkit-scrollbar { width: 10px; height: 10px; }
                .code-editor::-webkit-scrollbar-track { background: transparent; }
                .code-editor::-webkit-scrollbar-thumb { background: var(--border); border-radius: 0; }
                .code-editor::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

                /* STATUS BAR */
                .status-bar { height: 22px; min-height: 22px; background: #007acc; color: white; display: flex; align-items: center; padding: 0 12px; font-size: 0.7rem; gap: 12px; font-family: var(--font-mono); justify-content: flex-end; }
                .status-bar-item { display: flex; align-items: center; font-weight: 400; cursor: pointer; transition: opacity 0.2s; }
                .status-bar-item:hover { background: rgba(255,255,255,0.1); }
                .status-bar-sep { width: 0; }

                /* RIGHT ACTIVITY BAR */
                .activity-bar-right { width: 48px; min-width: 48px; background: var(--bg-card); border-left: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; padding-top: 12px; gap: 12px; }
                .ab-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--r-md); color: var(--text-muted); cursor: pointer; transition: 0.2s; position: relative; }
                .ab-icon:hover { color: var(--text-primary); background: var(--bg-hover); }
                .ab-icon.active { color: var(--accent); background: var(--accent-light); }
                .ab-icon.active::before { content: ''; position: absolute; left: -6px; top: 8px; bottom: 8px; width: 3px; background: var(--accent); border-radius: 0 4px 4px 0; }
                .ab-icon svg { width: 18px; height: 18px; }

                /* RIGHT PANEL */
                .right-panel { width: 280px; min-width: 280px; background: var(--bg-card); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .right-panel.collapsed { width: 0; min-width: 0; border: none; opacity: 0; }
                .rp-section { padding: 10px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
                .rp-section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
                .rp-member { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; border-left: 2px solid transparent; }
                .rp-member:hover { background: var(--bg-hover); }
                .rp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; border: 2px solid var(--bg-card); position: relative; z-index: 2; margin-right: -4px; margin-top: 16px; }
                .rp-dot.online { background: var(--success); }
                .rp-av { width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.7rem; flex-shrink: 0; }
                .rp-name { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
                .rp-file { font-size: 0.7rem; color: var(--text-secondary); font-family: var(--font-mono); margin-top: 2px; }
                
                /* CHAT & AI PANELS */
                .chat-area { flex: 1; display: flex; flex-direction: column; min-height: 0; background: var(--bg-main); }
                .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
                .chat-msg { padding: 8px 12px; border-left: 2px solid var(--border); }
                .chat-msg-name { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }
                .chat-msg-time { font-weight: 400; color: var(--text-muted); font-size: 0.65rem; margin-left: auto; }
                .chat-msg-text { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }
                .chat-input-row { padding: 12px; background: var(--bg-card); border-top: 1px solid var(--border); display: flex; gap: 8px; flex-shrink: 0; }
                .chat-input { flex: 1; padding: 6px 10px; border: 1px solid var(--border); border-radius: 2px; font-size: 0.8rem; outline: none; background: var(--bg-main); color: var(--text-primary); min-width: 0; }
                .chat-input:focus { border-color: var(--accent); }
                .chat-send { background: #007acc; color: white; border: none; padding: 6px 12px; border-radius: 2px; font-size: 0.8rem; font-weight: 600; cursor: pointer; flex-shrink: 0; }
                .chat-send:hover { background: #005f9e; }
                
                .ai-msg { background: var(--bg-hover); border-radius: var(--r-md); padding: 10px 14px; margin-bottom: 12px; }
                .ai-msg.user { background: var(--accent-light); border: 1px solid rgba(37,99,235,0.2); margin-left: 16px; }
                .ai-msg-header { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
                .ai-msg-text { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }

                /* CONTEXT MENU */
                .ctx-menu { position: fixed; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: 0 15px 35px -5px rgba(0,0,0,0.15); width: 220px; padding: 8px 0; z-index: 10000; display: flex; flex-direction: column; opacity: 0; pointer-events: none; transform: scale(0.95); transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: top left; }
                .ctx-menu.open { opacity: 1; pointer-events: auto; transform: scale(1); }
                .ctx-item { padding: 10px 20px; font-size: 0.85rem; font-weight: 500; color: var(--text-primary); cursor: pointer; transition: background 0.2s; }
                .ctx-item:hover { background: var(--bg-hover); color: var(--accent); }
                .ctx-item.danger { color: #ef4444; }
                .ctx-item.danger:hover { background: #fef2f2; color: #dc2626; }
                .ctx-divider { height: 1px; background: var(--border); margin: 6px 0; }
            `}</style>

            {/* CONTEXT MENU */}
            {ctxMenu.isOpen && (
                <div className="ctx-menu open" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
                    <div className="ctx-item" onClick={() => setNewItemModal({ isOpen: true, type: 'file', parentId: ctxMenu.targetId, name: '' })}>New file</div>
                    <div className="ctx-item" onClick={() => setNewItemModal({ isOpen: true, type: 'folder', parentId: ctxMenu.targetId, name: '' })}>New folder</div>
                    <div className="ctx-divider"></div>
                    <div className="ctx-item danger">Delete</div>
                </div>
            )}

            {newItemModal.isOpen && (
                <div className="modal-overlay active" onClick={() => setNewItemModal(prev => ({ ...prev, isOpen: false }))}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-title">Create New {newItemModal.type === 'file' ? 'File' : 'Folder'}</div>
                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <input 
                                autoFocus
                                className="form-input" 
                                placeholder={newItemModal.type === 'file' ? 'e.g. index.js' : 'e.g. src'} 
                                value={newItemModal.name}
                                onChange={e => setNewItemModal(prev => ({ ...prev, name: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleCreateItemSubmit()}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setNewItemModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateItemSubmit} disabled={!newItemModal.name.trim()}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="ws-root">
                {/* TOP BAR */}
                <div className="ws-topbar">
                    <div className="ws-logo">
                        <div className="ws-logo-icon"><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 3 1 9 5 15" /><polyline points="13 3 17 9 13 15" /></svg></div>
                    </div>
                    <div className="ws-divider"></div>
                    <span className="ws-proj-name">{projectId ? 'Project Workspace' : 'No Project Opened'}</span>
                    <div className="ws-divider"></div>

                    <div className="ws-breadcrumb">
                        <span className="ws-breadcrumb-item">src</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        <span className="ws-breadcrumb-item">{activeTab || 'No file'}</span>
                    </div>

                    <div className="ws-topbar-right">
                        <div className="ws-status-dot"></div>
                        <span style={{ fontSize: '.75rem', color: 'var(--success)', fontWeight: '700' }}>Live</span>
                        <div className="ws-divider"></div>
                        <button className="ws-topbar-btn" onClick={() => setExplorerOpen(!explorerOpen)}>Explorer</button>
                        <button className="ws-topbar-btn primary" onClick={saveFile}>Save</button>
                    </div>
                </div>

                {/* BODY */}
                <div className="ws-body">
                    {/* FILE EXPLORER */}
                    <div className={`file-explorer ${!explorerOpen ? 'collapsed' : ''}`}>
                        <div className="explorer-header">
                            <span className="explorer-title">Explorer</span>
                            <div className="explorer-actions">
                                <svg className="explorer-action-btn" title="New File" onClick={() => workspaceData ? setNewItemModal({ isOpen: true, type: 'file', parentId: null, name: '' }) : alert('Please open a Project first!')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                                <svg className="explorer-action-btn" title="New Folder" onClick={() => workspaceData ? setNewItemModal({ isOpen: true, type: 'folder', parentId: null, name: '' }) : alert('Please open a Project first!')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                            </div>
                        </div>
                        <div className="explorer-tree" onContextMenu={(e) => openCtxMenu(e, null)}>
                            {fileTree.map(node => <TreeNode key={node.id} node={node} depth={0} />)}
                        </div>
                    </div>

                    {/* EDITOR */}
                    <div className="editor-container">
                        {/* TABS */}
                        <div className="tab-bar">
                            {openTabs.map(id => (
                                <div key={id} className={`editor-tab ${id === activeTab ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                                    {getFileIcon(id)}
                                    {findNode(fileTree, id)?.modified && <div className="tab-dot"></div>}
                                    <span>{id}</span>
                                    <button className="tab-close" onClick={(e) => handleCloseTab(e, id)}>✕</button>
                                </div>
                            ))}
                        </div>

                        {/* TEXT AREA */}
                        {activeTab ? (
                            <div className="editor-wrap">
                                <div className="line-numbers">
                                    {Array.from({ length: codeLines }, (_, i) => <div key={i}>{i + 1}</div>)}
                                </div>
                                <div className="editor-area">
                                    <textarea
                                        className="code-editor"
                                        spellCheck="false"
                                        value={fileContents[activeTab] || ''}
                                        onChange={handleEditorChange}
                                        onClick={updateCursor}
                                        onKeyUp={updateCursor}
                                        onKeyDown={(e) => {
                                            if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveFile(); }
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                Select a file to edit
                            </div>
                        )}

                        {/* STATUS BAR */}
                        <div className="status-bar">
                            <div className="status-bar-item">Ln {cursorPos.ln}, Col {cursorPos.col}</div>
                            <div className="status-bar-sep"></div>
                            <div className="status-bar-item">{activeNode?.lang || 'Plain Text'}</div>
                            <div className="status-bar-sep"></div>
                            <div className="status-bar-item">UTF-8</div>
                        </div>
                    </div>

                    {/* RIGHT PANEL (Chat & AI) */}
                    <div className={`right-panel ${!rightPanelOpen ? 'collapsed' : ''}`}>
                        {activeRightView === 'chat' ? (
                            <>
                                <div className="rp-section">
                                    <div className="rp-section-title">Active Now</div>
                                    <div className="rp-member"><div className="rp-dot online"></div><div className="rp-av" style={{ background: '#2563eb' }}>JD</div><div><div className="rp-name">You</div><div className="rp-file">{activeTab}</div></div></div>
                                    <div className="rp-member"><div className="rp-dot online"></div><div className="rp-av" style={{ background: '#10b981' }}>SK</div><div><div className="rp-name">Sarah K.</div><div className="rp-file">auth.ts</div></div></div>
                                </div>
                                <div className="chat-area">
                                    <div className="rp-section" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}><div className="rp-section-title">Team Chat</div></div>
                                    <div className="chat-messages">
                                        {chatMessages.map(msg => (
                                            <div key={msg.id} className="chat-msg">
                                                <div className="chat-msg-name"><div className="rp-av" style={{ background: msg.color, width: '20px', height: '20px', fontSize: '.55rem' }}>{msg.initial}</div>{msg.sender} <span className="chat-msg-time">{msg.time}</span></div>
                                                <div className="chat-msg-text">{msg.text}</div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="chat-input-row">
                                        <input className="chat-input" placeholder="Message team…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} />
                                        <button className="chat-send" onClick={handleSendChat}>Send</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="chat-area" style={{ background: 'var(--bg-card)' }}>
                                <div className="rp-section" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <div className="rp-section-title" style={{ color: 'var(--accent)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                                        AI Assistant
                                    </div>
                                </div>
                                <div className="chat-messages" style={{ background: 'var(--bg-card)' }}>
                                    {aiMessages.map(msg => (
                                        <div key={msg.id} className={`ai-msg ${msg.sender === 'You' ? 'user' : ''}`}>
                                            <div className="ai-msg-header">
                                                {msg.sender === 'You' ? 'You' : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ color: 'var(--accent)' }}><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg> Agent</>}
                                            </div>
                                            <div className="ai-msg-text">{msg.text}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="chat-input-row">
                                    <input className="chat-input" placeholder="Ask AI..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendAi()} />
                                    <button className="chat-send" style={{ background: 'var(--accent)' }} onClick={handleSendAi}>Ask</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTIVITY BAR */}
                    <div className="activity-bar-right">
                        <div 
                            className={`ab-icon ${rightPanelOpen && activeRightView === 'chat' ? 'active' : ''}`} 
                            title="Team Chat"
                            onClick={() => {
                                if (rightPanelOpen && activeRightView === 'chat') setRightPanelOpen(false);
                                else { setRightPanelOpen(true); setActiveRightView('chat'); }
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div 
                            className={`ab-icon ${rightPanelOpen && activeRightView === 'ai' ? 'active' : ''}`} 
                            title="AI Assistant"
                            onClick={() => {
                                if (rightPanelOpen && activeRightView === 'ai') setRightPanelOpen(false);
                                else { setRightPanelOpen(true); setActiveRightView('ai'); }
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Workspace;