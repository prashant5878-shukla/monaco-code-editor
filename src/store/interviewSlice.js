import { createSlice } from '@reduxjs/toolkit';
import { SESSION_DURATION_MINUTES, SCENARIOS } from '../lib/constants';

const initialState = {
    started: false,
    runConfig: null,    // { installCommand, runCommand, port }
    timerRunning: false,
    timerRemaining: SESSION_DURATION_MINUTES * 60,  // seconds
    showSubmitModal: false,
    // ── Test runner state ────────────────────────────────────────────────────
    activeScenarioId: 'todo-api-s1',
    scenarioResults: {},
    // shape: { 'todo-api-s1': { 'tc-s1-1': 'pass'|'fail'|'pending'|'running', ... } }
    isRunningTests: false,
};

const interviewSlice = createSlice({
    name: 'interview',
    initialState,
    reducers: {
        // ── Existing actions ─────────────────────────────────────────────────
        startInterview(state, { payload: { runConfig = null } = {} }) {
            state.started = true;
            state.timerRunning = true;
            if (runConfig !== null) state.runConfig = runConfig;
        },
        stopTimer(state) {
            state.timerRunning = false;
        },
        tickTimer(state) {
            if (state.timerRemaining > 0) {
                state.timerRemaining -= 1;
            }
            if (state.timerRemaining === 0) {
                state.timerRunning = false;
            }
        },
        setRunConfig(state, { payload: config }) {
            state.runConfig = config;
        },
        setShowSubmitModal(state, { payload: show }) {
            state.showSubmitModal = show;
        },
        resetInterview(state) {
            state.started = false;
            state.runConfig = null;
            state.timerRunning = false;
            state.timerRemaining = SESSION_DURATION_MINUTES * 60;
            state.showSubmitModal = false;
            state.activeScenarioId = 'todo-api-s1';
            state.scenarioResults = {};
            state.isRunningTests = false;
        },

        // ── Test runner actions ──────────────────────────────────────────────
        setActiveScenario(state, { payload: scenarioId }) {
            state.activeScenarioId = scenarioId;
        },

        setTestResult(state, { payload: { testCaseId, status } }) {
            const scenario = SCENARIOS[state.activeScenarioId];
            if (!scenario) return;
            // Determine which scenario this test belongs to
            const scenarioId = Object.keys(SCENARIOS).find(sid =>
                SCENARIOS[sid].testCaseIds.includes(testCaseId)
            ) ?? state.activeScenarioId;
            if (!state.scenarioResults[scenarioId]) {
                state.scenarioResults[scenarioId] = {};
            }
            state.scenarioResults[scenarioId][testCaseId] = status;
        },

        setAllTestsRunning(state, { payload: scenarioId }) {
            const scenario = SCENARIOS[scenarioId];
            if (!scenario) return;
            if (!state.scenarioResults[scenarioId]) {
                state.scenarioResults[scenarioId] = {};
            }
            for (const id of scenario.testCaseIds) {
                state.scenarioResults[scenarioId][id] = 'running';
            }
        },

        setIsRunningTests(state, { payload: bool }) {
            state.isRunningTests = bool;
        },
    },
});

export const {
    startInterview,
    stopTimer,
    tickTimer,
    setRunConfig,
    setShowSubmitModal,
    resetInterview,
    setActiveScenario,
    setTestResult,
    setAllTestsRunning,
    setIsRunningTests,
} = interviewSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

/** Returns true when every test in the scenario has status 'pass'. */
export const selectScenarioPassed = (state, scenarioId) => {
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) return false;
    const results = state.interview.scenarioResults[scenarioId] ?? {};
    return scenario.testCaseIds.every(id => results[id] === 'pass');
};

export default interviewSlice.reducer;
