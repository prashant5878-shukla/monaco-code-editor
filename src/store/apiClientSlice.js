import { createSlice } from '@reduxjs/toolkit';

const getInitialState = () => {
  try {
    const stored = sessionStorage.getItem('api_client_state');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Reset loading state on reload
      parsed.isLoading = false;
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load api_client_state from sessionStorage", e);
  }
  
  return {
    method:      'GET',
    url:         '',
    activeTab:   'headers',   // 'body' | 'headers' | 'variables'
    body:        '',
    headers: [
      { id: 1, key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    variables:   [],          // [{ id, key, value, manuallyEdited }]
    response: null,           // { status, statusText, body, duration, isJson, rawBody }
    isLoading:   false,
    history:     [],          // last 10 requests: [{ method, urlPath, status, duration, body, headers }]
    historyOpen: false,
  };
};

const initialState = getInitialState();

const apiClientSlice = createSlice({
  name: 'apiClient',
  initialState,
  reducers: {
    setMethod(state, { payload }) {
      state.method = payload;
    },
    setUrl(state, { payload }) {
      state.url = payload;
    },
    setActiveTab(state, { payload }) {
      state.activeTab = payload;
    },
    setBody(state, { payload }) {
      state.body = payload;
    },
    addHeader(state) {
      state.headers.push({
        id: Date.now(),
        key: '',
        value: '',
        enabled: true
      });
    },
    updateHeader(state, { payload: { id, field, value } }) {
      const header = state.headers.find(h => h.id === id);
      if (header) {
        header[field] = value;
      }
    },
    toggleHeader(state, { payload: id }) {
      const header = state.headers.find(h => h.id === id);
      if (header) {
        header.enabled = !header.enabled;
      }
    },
    removeHeader(state, { payload: id }) {
      state.headers = state.headers.filter(h => h.id !== id);
    },
    setHeaders(state, { payload }) {
      state.headers = payload;
    },
    addVariable(state) {
      state.variables.push({
        id: Date.now(),
        key: '',
        value: '',
        manuallyEdited: true
      });
    },
    updateVariable(state, { payload: { id, field, value } }) {
      const variable = state.variables.find(v => v.id === id);
      if (variable) {
        variable[field] = value;
        variable.manuallyEdited = true;
      }
    },
    removeVariable(state, { payload: id }) {
      state.variables = state.variables.filter(v => v.id !== id);
    },
    setVariableFromBaseUrl(state, { payload: baseUrl }) {
      if (!baseUrl) return;
      const baseUrlVar = state.variables.find(v => v.key === 'BASE_URL');
      if (baseUrlVar) {
        if (!baseUrlVar.manuallyEdited) {
          baseUrlVar.value = baseUrl;
        }
      } else {
        state.variables.unshift({
          id: Date.now(),
          key: 'BASE_URL',
          value: baseUrl,
          manuallyEdited: false
        });
      }
    },
    setResponse(state, { payload }) {
      state.response = payload;
    },
    clearResponse(state) {
      state.response = null;
    },
    setIsLoading(state, { payload }) {
      state.isLoading = payload;
    },
    addToHistory(state, { payload: item }) {
      state.history = [item, ...state.history].slice(0, 10);
    },
    clearHistory(state) {
      state.history = [];
    },
    toggleHistory(state) {
      state.historyOpen = !state.historyOpen;
    },
    restoreFromHistory(state, { payload: item }) {
      state.method = item.method;
      state.url = item.urlPath;
      state.body = item.body || '';
      state.headers = item.headers && item.headers.length > 0
        ? item.headers.map((h, i) => ({
            id: h.id || Date.now() + i,
            key: h.key,
            value: h.value,
            enabled: h.enabled !== false
          }))
        : [{ id: Date.now(), key: '', value: '', enabled: true }];
    },
  }
});

export const {
  setMethod,
  setUrl,
  setActiveTab,
  setBody,
  addHeader,
  updateHeader,
  toggleHeader,
  removeHeader,
  setHeaders,
  addVariable,
  updateVariable,
  removeVariable,
  setVariableFromBaseUrl,
  setResponse,
  clearResponse,
  setIsLoading,
  addToHistory,
  clearHistory,
  toggleHistory,
  restoreFromHistory,
} = apiClientSlice.actions;

export default apiClientSlice.reducer;
