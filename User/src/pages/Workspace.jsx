import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import Editor from '@monaco-editor/react';
import TerminalPanel from '../components/TerminalPanel';

const getLanguageFromExtension = (filename) => {
    if (!filename) return 'plaintext';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
    if (lower.endsWith('.py')) return 'python';
    if (lower.endsWith('.html')) return 'html';
    if (lower.endsWith('.css')) return 'css';
    if (lower.endsWith('.json')) return 'json';
    if (lower.endsWith('.md')) return 'markdown';
    if (lower.endsWith('.java')) return 'java';
    if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h')) return 'cpp';
    if (lower.endsWith('.go')) return 'go';
    if (lower.endsWith('.rs')) return 'rust';
    if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'shell';
    if (lower.endsWith('.sql')) return 'sql';
    return 'plaintext';
};

const getFileIcon = (name) => {
    if (!name) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="3" /><path fill="#fff" d="M14.5 12.5h2v6h-2v-4.5l-1.5 2.5-1.5-2.5V18.5h-2v-6h2l1.5 2.5 1.5-2.5zm-7 1.5H6v-1.5h5v1.5H9.5V18.5h-2V14z" /></svg>;
    if (name.endsWith('.json')) return <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><text x="2" y="18" fontSize="14" fontWeight="bold" fontFamily="monospace">{`{}`}</text></svg>;
    if (name.endsWith('.md')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    if (name === '.env') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};

const Workspace = () => {
    const { projectId } = useParams();
    const [workspaceData, setWorkspaceData] = useState(null);
    const fileInputRef = useRef(null);
    const treeEnvironmentRef = useRef(null);
    const treeRef = useRef(null);
    const [treeData, setTreeData] = useState(new StaticTreeDataProvider({ 'root': { index: 'root', isFolder: true, children: [], data: 'root' } }, (item, data) => ({ ...item, data })));
    const [treeKey, setTreeKey] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);
    const [expandedItems, setExpandedItems] = useState(['root']);
    const [focusedItem, setFocusedItem] = useState(null);
    const [clipboard, setClipboard] = useState({ action: null, targetIds: [] });
    const [fileContents, setFileContents] = useState({});
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [explorerOpen, setExplorerOpen] = useState(true);

    const [renamingId, setRenamingId] = useState(null);
    const [renameInput, setRenameInput] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [theme, setTheme] = useState('dark');

    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [rightPanelWidth, setRightPanelWidth] = useState(320);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const isDraggingSidebar = useRef(false);
    const isDraggingRightPanel = useRef(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(0);

    const activeTabRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    const chatEndRef = useRef(null);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setIsTerminalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (projectId) {
            fetchWorkspace();
        } else {
            setTreeData(new StaticTreeDataProvider({ 'root': { index: 'root', isFolder: true, children: [], data: 'root' } }, (item, data) => ({ ...item, data })));
            setFileContents({});
            setOpenTabs([]);
            setActiveTab(null);
        }
    }, [projectId]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingSidebar.current) {
                let w = dragStartWidth.current + (e.clientX - dragStartX.current);
                if (w < 200) w = 200;
                if (w > 600) w = 600;
                setSidebarWidth(w);
            } else if (isDraggingRightPanel.current) {
                let w = dragStartWidth.current - (e.clientX - dragStartX.current);
                if (w < 250) w = 250;
                if (w > 800) w = 800;
                setRightPanelWidth(w);
            }
        };
        const handleMouseUp = () => {
            if (isDraggingSidebar.current || isDraggingRightPanel.current) {
                isDraggingSidebar.current = false;
                isDraggingRightPanel.current = false;
                document.body.style.cursor = 'default';
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const buildTreeData = (folders) => {
        const items = {};
        items['root'] = { index: 'root', isFolder: true, children: [], data: 'root' };

        const processFolder = (folder) => {
            const id = 'folder_' + folder.folder_id;
            const children = [];

            if (folder.subfolders) {
                folder.subfolders.forEach(sf => {
                    children.push('folder_' + sf.folder_id);
                    processFolder(sf);
                });
            }

            if (folder.files) {
                folder.files.forEach(f => {
                    const fileId = String(f.file_id);
                    children.push(fileId);
                    items[fileId] = {
                        index: fileId,
                        isFolder: false,
                        children: [],
                        data: { name: f.file_name, type: 'file' }
                    };
                });
            }

            items[id] = {
                index: id,
                isFolder: true,
                children: children,
                data: { name: folder.folder_name, type: 'folder' }
            };
        };

        folders.forEach(processFolder);

        const dbRootFolder = folders.find(f => f.folder_name === 'root');
        if (dbRootFolder) {
            const rootId = 'folder_' + dbRootFolder.folder_id;
            items['root'].children = items[rootId].children;
            setTreeData(new StaticTreeDataProvider(items, (item, data) => ({ ...item, data })));
            setTreeKey(prev => prev + 1);
        }
    };

    const fetchWorkspace = async () => {
        try {
            const res = await api.get(`/workspaces/project/${projectId}`);
            setWorkspaceData(res.data);
            if (res.data && res.data.folders) {
                buildTreeData(res.data.folders);
            }
        } catch (err) {
            console.error('Failed to fetch workspace', err);
        }
    };

    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'Sarah K.', initial: 'SK', color: 'var(--ws-accent)', time: '10:14 am', text: 'Just pushed the auth middleware — can someone review?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [aiMessages, setAiMessages] = useState([
        { id: 1, sender: 'AI Assistant', text: 'Hello! I am your AI coding assistant. I can help explain code, write tests, or find bugs. How can I help?' }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [activeRightView, setActiveRightView] = useState('chat');
    const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
    const [ctxMenu, setCtxMenu] = useState({ isOpen: false, x: 0, y: 0, targetId: null });
    const [creatingItem, setCreatingItem] = useState({ active: false, type: 'file', parentId: null, name: '' });

    const getParentIdForNewItem = () => {
        if (!selectedNodeId) {
            return workspaceData?.folders[0] ? 'folder_' + workspaceData.folders[0].folder_id : null;
        }
        if (selectedNodeId.startsWith('folder_')) return selectedNodeId;

        const findParent = (folders, targetFileId) => {
            for (const f of folders) {
                if (f.files.some(file => String(file.file_id) === String(targetFileId))) {
                    return 'folder_' + f.folder_id;
                }
                if (f.subfolders) {
                    const found = findParent(f.subfolders, targetFileId);
                    if (found) return found;
                }
            }
            return null;
        };
        const parentFolder = findParent(workspaceData?.folders || [], selectedNodeId);
        return parentFolder || (workspaceData?.folders[0] ? 'folder_' + workspaceData.folders[0].folder_id : null);
    };



    const handleOpenFile = async (id) => {
        setSelectedNodeId(id);
        if (!openTabs.includes(id)) setOpenTabs([...openTabs, id]);
        setActiveTab(id);
        if (!fileContents[id]) {
            try {
                const res = await api.get(`/files/${id}/content`);
                setFileContents(prev => ({ ...prev, [id]: res.data.file_content || '' }));
            } catch (err) {
                console.error("Failed to fetch file content", err);
                setFileContents(prev => ({ ...prev, [id]: `// Error loading file content\n` }));
            }
        }
    };

    const handleCloseTab = (e, id) => {
        e.stopPropagation();
        const newTabs = openTabs.filter(t => t !== id);
        setOpenTabs(newTabs);
        if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1] || null);
    };

    const handleEditorChange = (value) => {
        setFileContents(prev => ({ ...prev, [activeTab]: value }));

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            api.patch(`/files/${activeTab}`, { file_content: value })
                .then(() => console.log(`Auto-saved ${activeTab}`))
                .catch(err => console.error("Auto-save failed", err));
        }, 1500);
    };

    const handleEditorDidMount = (editor, monaco) => {
        editor.onDidChangeCursorPosition((e) => {
            setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            const currentTab = activeTabRef.current;
            if (currentTab) {
                api.patch(`/files/${currentTab}`, { file_content: editor.getValue() })
                    .then(() => console.log(`Manual save ${currentTab}`))
                    .catch(err => console.error("Failed to save", err));
            }
        });
    };

    const openCtxMenu = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const target = id || selectedNodeId;
        setCtxMenu({ isOpen: true, x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 160), targetId: target });
    };

    const closeCtxMenu = () => setCtxMenu(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        document.addEventListener('click', closeCtxMenu);
        return () => document.removeEventListener('click', closeCtxMenu);
    }, []);

    const handleDeleteItem = async (targetId) => {
        let itemsToDelete = [targetId];
        if (selectedItems.includes(targetId) && selectedItems.length > 1) {
            itemsToDelete = selectedItems;
        }

        try {
            for (const id of itemsToDelete) {
                if (id === 'root' || !id) continue;
                if (id.startsWith('folder_')) {
                    const folderId = id.replace('folder_', '');
                    await api.delete(`/folders/${folderId}`);
                } else {
                    await api.delete(`/files/${id}`);
                }

                if (!id.startsWith('folder_') && activeTab === id) {
                    const newTabs = openTabs.filter(t => t !== id);
                    setOpenTabs(newTabs);
                    setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
                }
            }
            fetchWorkspace();
            setSelectedItems([]);
        } catch (err) {
            console.error('Failed to delete item(s)', err);
            alert('Failed to delete some item(s). They might not be empty.');
        }
    };

    const openCreateInput = (type, forcedParentId = null) => {
        const parentId = forcedParentId !== null ? forcedParentId : getParentIdForNewItem();
        setCreatingItem({ active: true, type, parentId, name: '' });
        if (parentId) {
            setExpandedItems(prev => [...new Set([...prev, parentId])]);
        }
    };

    const handleCreateItemSubmit = async () => {
        if (!creatingItem.name.trim() || !workspaceData) {
            setCreatingItem({ active: false, type: 'file', parentId: null, name: '' });
            return;
        }

        let targetFolderId = workspaceData.folders[0]?.folder_id;
        if (creatingItem.parentId && creatingItem.parentId.startsWith('folder_')) {
            targetFolderId = parseInt(creatingItem.parentId.replace('folder_', ''));
        }

        try {
            if (creatingItem.type === 'file') {
                const extIndex = creatingItem.name.lastIndexOf('.');
                const extension = extIndex > -1 ? creatingItem.name.substring(extIndex) : '.txt';

                await api.post('/files/', {
                    workspace_id: workspaceData.workspace_id,
                    folder_id: targetFolderId,
                    file_name: creatingItem.name.trim(),
                    file_extension: extension,
                    mime_type: 'text/plain',
                    file_content: ''
                });
            } else {
                await api.post('/folders/', {
                    workspace_id: workspaceData.workspace_id,
                    parent_folder_id: targetFolderId,
                    folder_name: creatingItem.name.trim()
                });
            }

            setCreatingItem({ active: false, type: 'file', parentId: null, name: '' });
            fetchWorkspace();

        } catch (err) {
            console.error('Failed to create item', err);
            alert(err.response?.data?.detail || 'Failed to create item');
            setCreatingItem({ active: false, type: 'file', parentId: null, name: '' });
        }
    };

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages([...chatMessages, { id: Date.now(), sender: 'You', initial: 'JD', color: 'var(--ws-accent)', time, text: chatInput }]);
        setChatInput('');
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSendAi = () => {
        if (!aiInput.trim()) return;
        setAiMessages(prev => [...prev, { id: Date.now(), sender: 'You', text: aiInput }]);
        setAiInput('');
        setTimeout(() => {
            setAiMessages(prev => [...prev, { id: Date.now(), sender: 'AI Assistant', text: 'I am a highly advanced AI Assistant built directly into your modern workspace!' }]);
        }, 600);
    };

    const handleRenameItem = async (id, newName) => {
        if (!id || !newName.trim()) return;
        try {
            if (id.startsWith('folder_')) {
                const folderId = id.replace('folder_', '');
                await api.patch(`/folders/${folderId}`, { folder_name: newName.trim() });
            } else {
                await api.patch(`/files/${id}`, { file_name: newName.trim() });
            }
            fetchWorkspace();
        } catch (err) {
            console.error('Failed to rename item', err);
            alert('Failed to rename item');
        }
    };

    const handleMoveItem = async (items, targetId) => {
        if (!items || !items.length || !targetId) return;
        const targetFolderId = targetId === 'root' ? null : parseInt(targetId.replace('folder_', ''));
        try {
            for (const item of items) {
                const id = item.index;
                if (id.startsWith('folder_')) {
                    const folderId = id.replace('folder_', '');
                    await api.patch(`/folders/${folderId}`, { parent_folder_id: targetFolderId });
                } else {
                    await api.patch(`/files/${id}`, { folder_id: targetFolderId });
                }
            }
            fetchWorkspace();
        } catch (err) {
            console.error('Failed to move item', err);
            alert('Failed to move item');
        }
    };

    const handleClipboardAction = async (pasteTargetId) => {
        const { action, targetIds } = clipboard;
        if (!action || !targetIds || !targetIds.length || !pasteTargetId) return;

        let targetParentFolderId = null;
        if (pasteTargetId === 'root') {
            const dbRoot = workspaceData?.folders?.find(f => f.folder_name === 'root');
            if (dbRoot) targetParentFolderId = dbRoot.folder_id;
        } else if (pasteTargetId.startsWith('folder_')) {
            targetParentFolderId = parseInt(pasteTargetId.replace('folder_', ''));
        } else {
            const findParent = (folders, targetFileId) => {
                for (const f of folders) {
                    if (f.files.some(file => String(file.file_id) === String(targetFileId))) {
                        return f.folder_id;
                    }
                    if (f.subfolders) {
                        const found = findParent(f.subfolders, targetFileId);
                        if (found) return found;
                    }
                }
                return null;
            };
            targetParentFolderId = findParent(workspaceData?.folders || [], pasteTargetId);
        }

        try {
            for (const targetId of targetIds) {
                if (action === 'cut') {
                    if (targetId.startsWith('folder_')) {
                        const folderId = targetId.replace('folder_', '');
                        await api.patch(`/folders/${folderId}`, { parent_folder_id: targetParentFolderId });
                    } else {
                        await api.patch(`/files/${targetId}`, { folder_id: targetParentFolderId });
                    }
                } else if (action === 'copy') {
                    const queryParam = targetParentFolderId ? `?target_folder_id=${targetParentFolderId}` : '';
                    if (targetId.startsWith('folder_')) {
                        const folderId = targetId.replace('folder_', '');
                        await api.post(`/folders/${folderId}/copy${queryParam}`);
                    } else {
                        await api.post(`/files/${targetId}/copy${queryParam}`);
                    }
                }
            }
            setClipboard({ action: null, targetIds: [] });
            fetchWorkspace();
        } catch (err) {
            console.error('Failed to paste item(s)', err);
            alert('Failed to paste item(s)');
        }
    };

    useEffect(() => {
        const handlePaste = (e) => {
            const pasteTargetId = e.detail;
            handleClipboardAction(pasteTargetId);
        };
        const handleRename = (e) => {
            const id = e.detail;
            if (treeRef.current) {
                treeRef.current.startRenamingItem(id);
            }
        };
        document.addEventListener('trigger-paste', handlePaste);
        document.addEventListener('trigger-rename', handleRename);
        return () => {
            document.removeEventListener('trigger-paste', handlePaste);
            document.removeEventListener('trigger-rename', handleRename);
        };
    }, [clipboard, selectedNodeId]);

    const InlineInput = ({ depth }) => (
        <div className="tree-item" style={{ paddingLeft: `${24 + (depth * 14)}px` }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <div className="tree-file-icon" style={{ color: 'var(--ws-accent)' }}>
                {creatingItem.type === 'folder'
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                    : getFileIcon(creatingItem.name)
                }
            </div>
            <input
                autoFocus
                className="inline-create-input"
                value={creatingItem.name}
                onChange={e => setCreatingItem(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateItemSubmit();
                    if (e.key === 'Escape') setCreatingItem({ active: false, type: 'file', parentId: null, name: '' });
                }}
                onBlur={handleCreateItemSubmit}
                placeholder={`New ${creatingItem.type}...`}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
            />
        </div>
    );

    const getFileName = (fileId) => {
        if (!workspaceData) return fileId;
        const findFile = (folders) => {
            if (!folders) return null;
            for (const f of folders) {
                const file = f.files?.find(file => String(file.file_id) === String(fileId));
                if (file) return file.file_name;
                if (f.subfolders) {
                    const found = findFile(f.subfolders);
                    if (found) return found;
                }
            }
            return null;
        };
        return findFile(workspaceData.folders) || fileId;
    };
    const isRootCreating = creatingItem.active && (!creatingItem.parentId || creatingItem.parentId === (workspaceData?.folders[0] ? 'folder_' + workspaceData.folders[0].folder_id : null));

    return (
        <div className={`ws-universe ${theme}-theme`}>
            <style>{`
                .dark-theme {
                    --bg-app: #121214; 
                    --bg-panel: rgba(39, 39, 42, 0.7); 
                    --bg-elevated: rgba(63, 63, 70, 0.6);
                    --bg-hover: rgba(63, 63, 70, 0.9);
                    --bg-active: rgba(249, 115, 22, 0.15); /* orange tinted */
                    --border: rgba(255, 255, 255, 0.04);
                    --border-light: rgba(255, 255, 255, 0.08);
                    --text-primary: #f4f4f5;
                    --text-secondary: #a1a1aa;
                    --text-muted: #71717a;
                    --ws-accent: #f97316; /* orange */
                    --ws-accent-light: rgba(249, 115, 22, 0.2);
                    --ws-accent-hover: #ea580c;
                    --ws-success: #10b981;
                    --ws-error: #ef4444;
                    --panel-shadow: 0 16px 40px rgba(0,0,0,0.5);
                }
                
                .light-theme {
                    --bg-app: #e2e8f0; 
                    --bg-panel: rgba(255, 255, 255, 0.6); 
                    --bg-elevated: rgba(255, 255, 255, 0.8);
                    --bg-hover: rgba(243, 244, 246, 0.9);
                    --bg-active: rgba(16, 185, 129, 0.15); /* green tinted */
                    --border: rgba(0, 0, 0, 0.05);
                    --border-light: rgba(0, 0, 0, 0.1);
                    --text-primary: #0f172a;
                    --text-secondary: #475569;
                    --text-muted: #94a3b8;
                    --ws-accent: #10b981; /* green */
                    --ws-accent-light: rgba(16, 185, 129, 0.2);
                    --ws-accent-hover: #059669;
                    --ws-success: #059669;
                    --ws-error: #dc2626;
                    --panel-shadow: 0 16px 40px rgba(0,0,0,0.06);
                }
                
                /* Layout Framework */
                @keyframes meshGradient {
                    0% { background-position: 0% 0%; }
                    50% { background-position: 100% 100%; }
                    100% { background-position: 0% 0%; }
                }

                .ws-universe {
                    display: flex; flex-direction: column; height: 100vh; width: 100%; overflow: hidden; 
                    background: var(--bg-app);
                    background-image: 
                        radial-gradient(circle at 15% 50%, rgba(249, 115, 22, 0.05), transparent 25%),
                        radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.05), transparent 25%);
                    background-size: 200% 200%;
                    animation: meshGradient 15s ease infinite;
                    color: var(--text-primary); 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    padding: 16px;
                    gap: 16px;
                    transition: background 0.4s ease, color 0.4s ease;
                }
                
                * { box-sizing: border-box; }
                input, textarea, button { font-family: inherit; }

                /* Modern Floating Header (Compact Dynamic Island) */
                .glass-header { 
                    height: 52px; min-height: 52px; 
                    background: var(--bg-panel); 
                    backdrop-filter: blur(32px);
                    -webkit-backdrop-filter: blur(32px);
                    border: 1px solid var(--border-light); 
                    border-radius: 26px; 
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 12px 0 24px; gap: 24px; 
                    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
                    margin: 0 auto;
                    width: max-content;
                }
                
                .ws-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; color: var(--text-primary); letter-spacing: -0.01em; }
                .ws-brand svg { color: var(--ws-accent); width: 18px; height: 18px; }
                
                .header-actions { display: flex; align-items: center; gap: 8px; }
                .theme-toggle { 
                    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    background: transparent; color: var(--text-secondary); border: none; outline: none; cursor: pointer; 
                    transition: all 0.2s; flex-shrink: 0;
                }
                .theme-toggle:hover { background: var(--bg-hover); color: var(--text-primary); transform: scale(1.05); }
                
                /* Main Area */
                .ws-arena { display: flex; flex: 1; min-height: 0; gap: 2px; width: 100%; margin: 0 auto; }
                
                /* Floating Panels */
                .ws-panel {
                    background: var(--bg-panel); 
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid var(--border-light); 
                    border-radius: 20px; 
                    display: flex; flex-direction: column; 
                    overflow: hidden;
                    box-shadow: var(--panel-shadow);
                    transition: box-shadow 0.3s ease;
                }
                .ws-panel:hover {
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                }
                
                .panel-resizer {
                    width: 16px; margin: 0 -8px; cursor: ew-resize; z-index: 10;
                    display: flex; align-items: center; justify-content: center;
                }
                .panel-resizer::after {
                    content: ''; width: 4px; height: 40px; border-radius: 2px;
                    background: transparent; transition: background 0.2s;
                }
                .panel-resizer:hover::after, .panel-resizer:active::after {
                    background: var(--ws-accent);
                }
                
                /* Sidebar */
                .ws-sidebar { transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
                .ws-sidebar.collapsed { width: 0 !important; min-width: 0 !important; border: none; opacity: 0; margin-right: -12px; }
                
                .sidebar-header { 
                    padding: 20px 20px 12px 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; 
                    color: var(--text-secondary); letter-spacing: 0.05em; 
                    display: flex; align-items: center; justify-content: space-between; 
                }
                .action-pills { display: flex; gap: 4px; }
                .action-pill { 
                    width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
                    color: var(--text-secondary); cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
                }
                .action-pill:hover { background: var(--bg-hover); color: var(--text-primary); }
                
                /* Sleek Tree View */
                .explorer-tree { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 8px; }
                .tree-item { 
                    display: flex; align-items: center; height: 32px; margin-bottom: 2px;
                    border-radius: 8px; cursor: pointer; user-select: none; position: relative; 
                    color: var(--text-primary); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tree-item:hover { background: var(--bg-hover); transform: translateX(2px); }
                .tree-item.selected { background: var(--bg-active); color: var(--ws-accent); }
                
                .tree-chevron { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: transform 0.2s; }
                .tree-chevron.open { transform: rotate(90deg); }
                .tree-file-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0; }
                .tree-label { font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .tree-modified-dot { width: 6px; height: 6px; background: var(--ws-accent); border-radius: 50%; margin-left: auto; margin-right: 8px; }
                
                .inline-create-input { 
                    flex: 1; height: 26px; background: var(--bg-elevated); border: 1px solid var(--ws-accent); border-radius: 6px; 
                    color: var(--text-primary); font-size: 0.85rem; padding: 0 8px; outline: none; margin-right: 8px; width: calc(100% - 24px); box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                /* Editor Center */
                .ws-editor-stage { flex: 1; display: flex; flex-direction: column; min-width: 0; }
                
                /* Floating Pill Tabs */
                .pill-tab-bar { 
                    display: flex; align-items: center; padding: 16px 20px; gap: 10px; overflow-x: auto; 
                    border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.1);
                }
                .pill-tab-bar::-webkit-scrollbar { height: 0px; }
                
                .pill-tab { 
                    display: flex; align-items: center; gap: 8px; padding: 6px 14px; 
                    border-radius: 20px; font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); 
                    background: var(--bg-elevated); border: 1px solid var(--border); cursor: pointer; 
                    user-select: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap;
                }
                .pill-tab:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-light); transform: translateY(-1px); }
                .pill-tab.active { background: linear-gradient(135deg, var(--ws-accent), var(--ws-accent-hover)); color: white; border-color: transparent; box-shadow: 0 4px 12px var(--ws-accent-light); }
                
                .pill-close { 
                    opacity: 0; border: none; background: rgba(0,0,0,0.1); color: inherit; cursor: pointer; 
                    width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; 
                    border-radius: 50%; transition: all 0.2s; margin-left: 4px;
                }
                .pill-tab:hover .pill-close, .pill-tab.active .pill-close { opacity: 1; }
                .pill-close:hover { background: rgba(0,0,0,0.2); transform: scale(1.1); }

                /* Premium Editor Area */
                .editor-viewport { display: flex; flex: 1; overflow: hidden; background: transparent; }
                .editor-gutter { 
                    width: 50px; min-width: 50px; display: flex; flex-direction: column; align-items: flex-end; 
                    padding: 20px 16px 20px 0; font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace; 
                    font-size: 14px; color: var(--text-muted); user-select: none; line-height: 1.6; border-right: 1px solid var(--border);
                }
                .code-textarea { 
                    flex: 1; background: transparent; border: none; outline: none; padding: 20px 16px; 
                    font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace; font-size: 14px; 
                    color: var(--text-primary); line-height: 1.6; resize: none; overflow: auto; white-space: pre; tab-size: 4;
                }
                
                .code-textarea::-webkit-scrollbar { width: 12px; height: 12px; }
                .code-textarea::-webkit-scrollbar-track { background: transparent; }
                .code-textarea::-webkit-scrollbar-thumb { background: var(--border); border: 3px solid var(--bg-panel); border-radius: 6px; }
                .code-textarea::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

                /* Floating Status Pill */
                .status-pill {
                    position: absolute; bottom: 24px; right: 24px; background: var(--bg-elevated); border: 1px solid var(--border-light);
                    border-radius: 24px; display: flex; align-items: center; padding: 8px 20px; gap: 16px; font-size: 0.75rem; 
                    font-weight: 600; color: var(--text-secondary); box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    backdrop-filter: blur(12px);
                }
                .status-item { display: flex; align-items: center; gap: 6px; }
                .status-item span { color: var(--ws-accent); }

                /* Modern Right Panel */
                .ws-right-panel { display: flex; flex-direction: column; transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
                .ws-right-panel.collapsed { width: 0 !important; min-width: 0 !important; border: none; opacity: 0; margin-left: -12px; }
                
                .rp-header { 
                    padding: 20px 20px 12px 20px; display: flex; align-items: center; justify-content: flex-start; gap: 20px;
                }
                .rp-tabs { display: flex; gap: 20px; }
                .rp-tab { 
                    font-size: 0.85rem; font-weight: 600; color: var(--text-muted); 
                    cursor: pointer; transition: all 0.2s; position: relative; padding-bottom: 4px;
                    white-space: nowrap;
                }
                .rp-tab:hover { color: var(--text-secondary); }
                .rp-tab.active { color: var(--text-primary); }
                .rp-tab.active::after {
                    content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
                    width: 12px; height: 3px; border-radius: 2px; background: var(--ws-accent);
                    box-shadow: 0 0 8px var(--ws-accent);
                }
                
                .chat-area { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
                .chat-bubble { background: var(--bg-elevated); padding: 12px 16px; border-radius: 12px 12px 12px 2px; border: 1px solid var(--border); }
                .chat-bubble.you { border-radius: 12px 12px 2px 12px; background: var(--ws-accent-light); border-color: transparent; align-self: flex-end; }
                
                .chat-sender { font-size: 0.75rem; font-weight: 700; color: var(--ws-accent); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; }
                .chat-bubble.you .chat-sender { color: var(--ws-accent-hover); }
                .chat-text { font-size: 0.85rem; line-height: 1.5; color: var(--text-primary); }
                
                .chat-input-box { padding: 16px; border-top: 1px solid var(--border); background: var(--bg-panel); }
                .chat-input { 
                    width: 100%; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 24px; 
                    color: var(--text-primary); padding: 10px 16px; outline: none; font-size: 0.85rem; transition: border 0.2s;
                }
                .chat-input:focus { border-color: var(--ws-accent); box-shadow: 0 0 0 3px var(--ws-accent-light); }

                /* Context Menu */
                .ctx-menu { 
                    position: fixed; background: var(--bg-elevated); border: 1px solid var(--border); 
                    border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); width: 220px; padding: 8px; 
                    z-index: 10000; display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 500;
                    backdrop-filter: blur(10px);
                }
                .ctx-item { padding: 8px 16px; color: var(--text-primary); cursor: pointer; border-radius: 6px; transition: all 0.1s; display: flex; align-items: center; gap: 8px; }
                .ctx-item:hover { background: var(--ws-accent); color: white; }
                .ctx-item.danger:hover { background: var(--ws-error); }
                .ctx-divider { height: 1px; background: var(--border); margin: 6px 0; }
                
                /* Action Bar Sidebar Toggle */
                .sidebar-toggle-btn {
                    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    background: transparent; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; border: none; outline: none;
                    flex-shrink: 0;
                }
                .sidebar-toggle-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: scale(1.05); }
                .sidebar-toggle-btn.active { color: var(--ws-accent); background: var(--bg-elevated); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            `}</style>

            {ctxMenu.isOpen && (
                <div className="ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
                    <div className="ctx-item" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); openCreateInput('file', ctxMenu.targetId); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                        New File
                    </div>
                    <div className="ctx-item" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); openCreateInput('folder', ctxMenu.targetId); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                        New Folder
                    </div>
                    {ctxMenu.targetId !== 'root' && (
                        <>
                            <div className="ctx-divider"></div>
                            <div className="ctx-item" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); document.dispatchEvent(new CustomEvent('trigger-rename', { detail: ctxMenu.targetId })); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Rename
                            </div>
                            <div className="ctx-item" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); const targets = (selectedItems.includes(ctxMenu.targetId) && selectedItems.length > 1) ? selectedItems : [ctxMenu.targetId]; setClipboard({ action: 'copy', targetIds: targets }); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                Copy
                            </div>
                            <div className="ctx-item" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); const targets = (selectedItems.includes(ctxMenu.targetId) && selectedItems.length > 1) ? selectedItems : [ctxMenu.targetId]; setClipboard({ action: 'cut', targetIds: targets }); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
                                Cut
                            </div>
                            <div className="ctx-item" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); document.dispatchEvent(new CustomEvent('trigger-paste', { detail: ctxMenu.targetId })); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                                Paste
                            </div>
                            <div className="ctx-divider"></div>
                            <div className="ctx-item danger" onClick={(e) => { e.stopPropagation(); closeCtxMenu(); handleDeleteItem(ctxMenu.targetId); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                Delete
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* FLOATING HEADER */}
            <div className="glass-header">
                <div className="ws-brand">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    <span>Nexus <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Workspace</span></span>
                </div>

                <div className="header-actions">
                    <button className={`sidebar-toggle-btn ${isTerminalOpen ? 'active' : ''}`} onClick={() => setIsTerminalOpen(!isTerminalOpen)} title="Toggle Terminal (Ctrl + `)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
                    </button>
                    <button className="sidebar-toggle-btn" onClick={() => window.location.href = '/dashboard'} title="Back to Dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </button>
                    <button className={`sidebar-toggle-btn ${explorerOpen ? 'active' : ''}`} onClick={() => setExplorerOpen(!explorerOpen)} title="Toggle Explorer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
                    </button>
                    <button className={`sidebar-toggle-btn ${rightPanelOpen ? 'active' : ''}`} onClick={() => setRightPanelOpen(!rightPanelOpen)} title="Toggle Sidebar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
                    </button>
                    <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
                        {theme === 'dark' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* ARENA */}
            <div className="ws-arena">

                {/* EXPLORER PANEL */}
                <div className={`ws-panel ws-sidebar ${!explorerOpen ? 'collapsed' : ''}`} style={explorerOpen ? { width: sidebarWidth, minWidth: sidebarWidth } : {}}>
                    <div className="sidebar-header">
                        Project Files
                        <div className="action-pills">
                            <div className="action-pill" title="New File" onClick={() => workspaceData ? openCreateInput('file') : null}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                            </div>
                            <div className="action-pill" title="New Folder" onClick={() => workspaceData ? openCreateInput('folder') : null}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="explorer-tree" onContextMenu={(e) => { e.preventDefault(); openCtxMenu(e, 'root'); }} onClick={() => { setSelectedNodeId('root'); setSelectedItems([]); }}>
                        {isRootCreating && <InlineInput depth={0} />}
                        <UncontrolledTreeEnvironment
                            ref={treeEnvironmentRef}
                            key={treeKey}
                            dataProvider={treeData}
                            getItemTitle={item => item.data.name}
                            viewState={{ 'workspace-tree': { expandedItems, selectedItems } }}
                            onExpandItem={item => setExpandedItems(prev => [...new Set([...prev, item.index])])}
                            onCollapseItem={item => setExpandedItems(prev => prev.filter(i => i !== item.index))}
                            onSelectItems={(items) => setSelectedItems(items)}
                            onRenameItem={async (item, name) => {
                                handleRenameItem(item.index, name);
                            }}
                            onDrop={async (items, target) => {
                                handleMoveItem(items, target.parentItem);
                            }}
                            canDragAndDrop={true}
                            canDropOnFolder={true}
                            canReorderItems={true}
                            canSearch={false}
                            renderItemTitle={({ title, item, context }) => {
                                if (context.isRenaming || renamingId === item.index) {
                                    return (
                                        <input
                                            className="inline-create-input"
                                            defaultValue={title}
                                            onBlur={(e) => {
                                                if (context.isRenaming) context.submitRename(e.target.value);
                                                else { handleRenameItem(item.index, e.target.value); setRenamingId(null); }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (context.isRenaming) context.submitRename(e.target.value);
                                                    else { handleRenameItem(item.index, e.target.value); setRenamingId(null); }
                                                }
                                                if (e.key === 'Escape') {
                                                    if (context.isRenaming) context.abortRename();
                                                    else setRenamingId(null);
                                                }
                                            }}
                                            autoFocus
                                            onClick={e => e.stopPropagation()}
                                            onMouseDown={e => e.stopPropagation()}
                                        />
                                    );
                                }
                                return <span className="tree-label" style={{ fontWeight: selectedItems.includes(item.index) ? 600 : 500 }}>{title}</span>;
                            }}
                            renderItem={({ item, depth, children, title, context, arrow }) => {
                                const isSelected = selectedItems.includes(item.index);
                                const isActive = activeTab === item.index;
                                return (
                                    <li {...context.itemContainerWithChildrenProps} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                        <div
                                            className={`tree-item ${isSelected ? 'selected' : ''}`}
                                            style={{ paddingLeft: `${12 + depth * 16}px` }}
                                            {...context.itemContainerWithoutChildrenProps}
                                            {...context.interactiveElementProps}
                                            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedNodeId(item.index); openCtxMenu(e, item.index); }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFocusedItem(item.index);
                                                if (selectedItems.includes(item.index) && selectedItems.length === 1) {
                                                    setSelectedItems([]);
                                                    if (selectedNodeId === item.index) setSelectedNodeId(null);
                                                } else {
                                                    setSelectedItems([item.index]);
                                                    setSelectedNodeId(item.index);
                                                }

                                                if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                                                    if (item.isFolder) {
                                                        context.toggleExpandedState();
                                                    } else {
                                                        handleOpenFile(item.index);
                                                    }
                                                }
                                            }}
                                        >
                                            {item.isFolder ? (
                                                <>
                                                    <div className={`tree-chevron ${context.isExpanded ? 'open' : ''}`}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                                    </div>
                                                    <div className="tree-file-icon" style={{ color: context.isExpanded ? 'var(--ws-accent)' : 'var(--text-secondary)' }}>
                                                        <svg viewBox="0 0 24 24" fill={context.isExpanded ? 'var(--ws-accent-light)' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="tree-file-icon" style={{ color: isActive ? 'var(--ws-accent)' : 'var(--text-muted)', marginLeft: 20 }}>
                                                    {getFileIcon(item.data.name)}
                                                </div>
                                            )}
                                            {title}
                                        </div>
                                        {context.isExpanded && children}
                                        {creatingItem.active && creatingItem.parentId === item.index && (
                                            <InlineInput depth={depth + 1} />
                                        )}
                                    </li>
                                );
                            }}
                        >
                            <Tree treeId="workspace-tree" rootItem="root" treeLabel="Workspace Explorer" ref={treeRef} />
                        </UncontrolledTreeEnvironment>
                    </div>
                </div>

                {explorerOpen && (
                    <div className="panel-resizer" onMouseDown={(e) => {
                        isDraggingSidebar.current = true;
                        dragStartX.current = e.clientX;
                        dragStartWidth.current = sidebarWidth;
                        document.body.style.cursor = 'ew-resize';
                    }} />
                )}

                {/* EDITOR PANEL */}
                <div className="ws-panel ws-editor-stage" style={{ position: 'relative' }}>
                    {openTabs.length > 0 && (
                        <div className="pill-tab-bar">
                            {openTabs.map(id => (
                                <div key={id} className={`pill-tab ${id === activeTab ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14 }}>{getFileIcon(getFileName(id))}</div>
                                    <span>{getFileName(id)}</span>
                                    <button className="pill-close" onClick={(e) => handleCloseTab(e, id)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab ? (
                        <div className="editor-viewport" style={{ padding: 0 }}>
                            <Editor
                                height="calc(100% - 32px)"
                                width="100%"
                                theme="vs-dark"
                                language={getLanguageFromExtension(getFileName(activeTab))}
                                value={fileContents[activeTab] || ''}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    fontFamily: "'Fira Code', 'Courier New', monospace",
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                    padding: { top: 16 }
                                }}
                            />
                            <div className="status-pill">
                                <div className="status-item">Ln <span>{cursorPos.ln}</span>, Col <span>{cursorPos.col}</span></div>
                                <div className="status-item">UTF-8</div>
                                <div className="status-item">{getLanguageFromExtension(getFileName(activeTab))}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" opacity="0.5"><rect x="3" y="3" width="18" height="18" rx="4" ry="4" /><polyline points="9 3 9 21" /><path d="M14 9l3 3-3 3" /></svg>
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Select a file to begin coding</span>
                            <span style={{ fontWeight: 400, fontSize: '0.8rem', opacity: 0.5, marginTop: 8 }}>or create a new file in the project explorer</span>
                        </div>
                    )}

                    <TerminalPanel
                        workspaceId={workspaceData?.workspace_id}
                        isOpen={isTerminalOpen}
                        onClose={() => setIsTerminalOpen(false)}
                        onSyncTriggered={fetchWorkspace}
                    />
                </div>

                {rightPanelOpen && (
                    <div className="panel-resizer" onMouseDown={(e) => {
                        isDraggingRightPanel.current = true;
                        dragStartX.current = e.clientX;
                        dragStartWidth.current = rightPanelWidth;
                        document.body.style.cursor = 'ew-resize';
                    }} />
                )}

                {/* ACTIVITY PANEL */}
                <div className={`ws-panel ws-right-panel ${!rightPanelOpen ? 'collapsed' : ''}`} style={rightPanelOpen ? { width: rightPanelWidth, minWidth: rightPanelWidth } : {}}>
                    <div className="rp-header">
                        <div className="rp-tabs">
                            <div className={`rp-tab ${activeRightView === 'chat' ? 'active' : ''}`} onClick={() => setActiveRightView('chat')}>Team Chat</div>
                            <div className={`rp-tab ${activeRightView === 'ai' ? 'active' : ''}`} onClick={() => setActiveRightView('ai')}>Assistant</div>
                        </div>
                    </div>

                    {activeRightView === 'chat' ? (
                        <>
                            <div className="chat-area">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`chat-bubble ${msg.sender === 'You' ? 'you' : ''}`}>
                                        <div className="chat-sender">
                                            {msg.sender} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{msg.time}</span>
                                        </div>
                                        <div className="chat-text">{msg.text}</div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="chat-input-box">
                                <input
                                    className="chat-input"
                                    placeholder="Type a message..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="chat-area">
                                {aiMessages.map(msg => (
                                    <div key={msg.id} className={`chat-bubble ${msg.sender === 'You' ? 'you' : ''}`}>
                                        <div className="chat-sender">
                                            {msg.sender === 'AI Assistant' ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
                                                    Assistant
                                                </span>
                                            ) : msg.sender}
                                        </div>
                                        <div className="chat-text">{msg.text}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input-box">
                                <input
                                    className="chat-input"
                                    placeholder="Ask the Assistant..."
                                    value={aiInput}
                                    onChange={e => setAiInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendAi()}
                                />
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Workspace;