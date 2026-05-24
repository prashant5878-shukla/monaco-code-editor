import { configureStore } from '@reduxjs/toolkit';
import fileSystemReducer from './fileSystemSlice';
import editorReducer     from './editorSlice';
import sandboxReducer    from './sandboxSlice';
import interviewReducer  from './interviewSlice';
import startReducer      from './startSlice';
import apiClientReducer  from './apiClientSlice';

export const store = configureStore({
    reducer: {
        fileSystem: fileSystemReducer,
        editor:     editorReducer,
        sandbox:    sandboxReducer,
        interview:  interviewReducer,
        start:      startReducer,
        apiClient:  apiClientReducer,
    },
    middleware: (getDefault) =>
        // serializableCheck: false because useSandbox keeps non-serializable SDK refs
        // as useRef — they never enter the store, but this keeps RTK quiet for any
        // edge cases where timers or callback refs brush the middleware.
        getDefault({ serializableCheck: false }),
});
