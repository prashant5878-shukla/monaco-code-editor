import { createSlice } from '@reduxjs/toolkit';

// phase values:
// idle | creating | writing | installing | starting | running | pausing | paused | resuming | error
const initialState = {
    phase:      'idle',
    previewUrl: null,
    logs:       [],   // { text: string, type: 'out' | 'err' }[]
};

const sandboxSlice = createSlice({
    name: 'sandbox',
    initialState,
    reducers: {
        setPhase(state, { payload: phase }) {
            state.phase = phase;
        },
        setPreviewUrl(state, { payload: url }) {
            state.previewUrl = url;
        },
        addLog(state, { payload: { text, type = 'out' } }) {
            state.logs.push({ text, type });
        },
        appendLog(state, { payload: { text, type = 'out' } }) {
            const last = state.logs[state.logs.length - 1];
            if (last && last.type === type) {
                last.text += text;
            } else {
                state.logs.push({ text, type });
            }
        },
        clearLogs(state) {
            state.logs = [];
        },
        resetSandbox(state) {
            state.phase = 'idle';
            state.previewUrl = null;
        },
    },
});

export const {
    setPhase,
    setPreviewUrl,
    addLog,
    appendLog,
    clearLogs,
    resetSandbox,
} = sandboxSlice.actions;

export default sandboxSlice.reducer;
