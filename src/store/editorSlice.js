import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    viewMode:     'code',       // 'code' | 'preview'
    leftPanel:    'problem',    // 'explorer' | 'problem' | null
    showChat:     true,
    sidebarWidth: 260,
    pendingChange: null,        // { nodeId, filePath, originalContent, changedLines }
    diffStats:    null,         // { additions, deletions } | null
};

const editorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setViewMode(state, { payload: mode }) {
            state.viewMode = mode;
        },
        setLeftPanel(state, { payload: panel }) {
            state.leftPanel = panel;
        },
        toggleChat(state) {
            state.showChat = !state.showChat;
        },
        setSidebarWidth(state, { payload: width }) {
            state.sidebarWidth = width;
        },
        setPendingChange(state, { payload: change }) {
            state.pendingChange = change;
        },
        clearPendingChange(state) {
            state.pendingChange = null;
        },
        setDiffStats(state, { payload: stats }) {
            state.diffStats = stats;
        },
        clearDiffStats(state) {
            state.diffStats = null;
        },
    },
});

export const {
    setViewMode,
    setLeftPanel,
    toggleChat,
    setSidebarWidth,
    setPendingChange,
    clearPendingChange,
    setDiffStats,
    clearDiffStats,
} = editorSlice.actions;

export default editorSlice.reducer;
