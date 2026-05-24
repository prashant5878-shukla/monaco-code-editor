import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  form: {
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    noticePeriod: '',
    currentCTC: '',
    expectedCTC: '',
    resumeFileName: '',
    resumeSize: 0,
  },
  checks: {
    internet:    'idle',  // idle | checking | pass | fail
    browser:     'idle',
    storage:     'idle',
    camera:      'idle',
    microphone:  'idle',
    screenShare: 'idle',
  },
  audioLevel: 0,          // 0-100
};

const startSlice = createSlice({
  name: 'start',
  initialState,
  reducers: {
    updateForm(state, { payload: { field, value } }) {
      state.form[field] = value;
    },
    setCheckStatus(state, { payload: { key, status } }) {
      state.checks[key] = status;
    },
    setAudioLevel(state, { payload: level }) {
      state.audioLevel = level;
    },
    resetStart() {
      return initialState;
    },
  },
});

export const {
  updateForm,
  setCheckStatus,
  setAudioLevel,
  resetStart,
} = startSlice.actions;

export default startSlice.reducer;
