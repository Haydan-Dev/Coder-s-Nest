# File Lock and Live Cursor Visibility Fixes

## Goal
Fix the live cursor CSS visibility and implement an exclusive file-level write lock based on user typing activity.

## Open Questions
None. The user's instructions were very detailed and explicit.

## Proposed Changes

### `Workspace.jsx`
1. **Cursor CSS Overhaul**:
   - Update `.yRemoteSelectionHead` and `.yRemoteSelectionHead::after`.
   - Remove `opacity: 0` so the name tag is ALWAYS visible (as requested: "name dikhe likhne waale kaa").
   - Ensure the cursor line is clearly visible using `border-left: 2px solid`.

2. **File Lock State Management**:
   - Introduce `[lockInfo, setLockInfo] = useState({ locked: false, by: null })`.
   - When Yjs awareness changes (`provider.awareness.on('change')`), iterate through all remote client states.
   - If any remote client has `isEditing: true`, set `lockInfo` to `{ locked: true, by: remoteUser.name }`.
   - If no remote client is editing, set `lockInfo` to `{ locked: false, by: null }`.

3. **Acquiring the Lock**:
   - In `handleEditorChange`, when the local user types their first character, set `provider.awareness.setLocalStateField('isEditing', true)`.
   - Because `provider` is destroyed when `activeTab` changes, this lock is automatically released ONLY when the user switches to another file, fulfilling the exact requirement: "jab tak user uss page se likhna chor ke dusre page may likhna shuru nai karde".

4. **Enforcing the Lock**:
   - Pass `readOnly: lockInfo.locked` to the `<Editor>` options.
   - Add a small floating banner/badge inside the editor viewport when a file is locked: "🔒 Read Only: {lockInfo.by} is writing".

## Verification Plan
- Build the frontend.
- Launch the backend.
- The user can verify that opening a file allows typing. Once typed, the other user will see a lock banner and their editor will be set to read-only.
- The name badge on the remote cursor will be visible at all times.
