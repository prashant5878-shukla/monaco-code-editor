import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icons } from '../../../lib/icons';
import {
  setVariableFromBaseUrl,
  setActiveTab,
  setResponse,
  clearResponse,
  setIsLoading,
  addToHistory,
  clearHistory,
  setHeaders,
} from '../../../store/apiClientSlice';

import { RequestBar } from './RequestBar';
import { RequestTabs } from './RequestTabs';
import { BodyTab } from './BodyTab';
import { HeadersTab } from './HeadersTab';
import { VariablesTab } from './VariablesTab';
import { ResponsePanel } from './ResponsePanel';
import { HistoryPanel } from './HistoryPanel';

// ── Pure variables resolution helper ──────────────────────────────────────────
function resolveVariables(str, variables) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const found = variables.find(v => v.key === key);
    return found ? found.value : `{{${key}}}`; // leave unresolved if not found
  });
}

// ── Pure resolved URL visualizer ──────────────────────────────────────────────
function renderResolvedUrl(urlPath, variables, effectiveBaseUrl) {
  if (typeof urlPath !== 'string') return urlPath;
  
  // If URL is relative, prepend the resolved BASE_URL variable or effectiveBaseUrl
  const isRelative = !/^https?:\/\//i.test(urlPath) && !urlPath.startsWith('{{');
  if (isRelative) {
    const baseUrlVar = variables.find(v => v.key === 'BASE_URL');
    const base = baseUrlVar ? baseUrlVar.value.trim() : (effectiveBaseUrl ? effectiveBaseUrl.trim() : '');
    if (base) {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanPath = urlPath.replace(/^\/+/, '');
      return (
        <>
          <span className="text-secondary">{cleanBase}</span>
          <span className="text-muted">/</span>
          <span className="text-muted">{cleanPath}</span>
        </>
      );
    }
  }

  const regex = /(\{\{\w+\}\})/g;
  const splitParts = urlPath.split(regex);
  
  return splitParts.map((part, idx) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const key = part.slice(2, -2);
      const found = variables.find(v => v.key === key);
      if (found) {
        return <span key={idx} className="text-secondary">{found.value}</span>;
      } else {
        return <span key={idx} className="text-warning font-semibold">{part}</span>;
      }
    }
    return <span key={idx} className="text-muted">{part}</span>;
  });
}

export function ApiClient({ baseUrl, previewUrl }) {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.apiClient);
  
  const [bodyError, setBodyError] = useState(null);
  const effectiveBaseUrl = baseUrl || previewUrl;
  const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(state.method);

  // ── Sync baseUrl to Redux environment variables ────────────────────────────
  useEffect(() => {
    if (effectiveBaseUrl) {
      dispatch(setVariableFromBaseUrl(effectiveBaseUrl));
    }
  }, [effectiveBaseUrl, dispatch]);

  // ── Persist entire apiClient slice to sessionStorage on changes ────────────
  useEffect(() => {
    sessionStorage.setItem('api_client_state', JSON.stringify(state));
  }, [state]);

  // ── Manage tab fallback when body tab becomes hidden ───────────────────────
  useEffect(() => {
    if (!isBodyMethod && state.activeTab === 'body') {
      dispatch(setActiveTab('headers'));
    }
  }, [state.method, isBodyMethod, state.activeTab, dispatch]);

  // ── Pre-fill Content-Type when request body becomes supported ──────────────
  useEffect(() => {
    if (isBodyMethod) {
      const hasContentType = state.headers.some(h => h.key.toLowerCase() === 'content-type');
      if (!hasContentType) {
        const filtered = state.headers.filter(h => h.key.trim() || h.value.trim());
        dispatch(setHeaders([
          { id: Date.now(), key: 'Content-Type', value: 'application/json', enabled: true },
          ...filtered
        ]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.method, isBodyMethod]);

  // ── URL & Variables analysis ───────────────────────────────────────────────
  const getFullUrl = () => {
    return resolveVariables(state.url, state.variables);
  };

  const getUrlVariables = () => {
    const matches = [];
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = regex.exec(state.url)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const urlVariables = getUrlVariables();
  const variablePills = urlVariables.map(name => {
    const found = state.variables.find(v => v.key === name);
    return { name, resolved: !!found };
  });

  // ── Send REST API Request Handler ──────────────────────────────────────────
  const handleSend = async () => {
    if (!state.url.trim()) return;
    setBodyError(null);

    let resolvedUrl = getFullUrl();
    
    // Safety check for relative URLs: Prepend BASE_URL or effectiveBaseUrl if present
    if (!/^https?:\/\//i.test(resolvedUrl)) {
      const baseUrlVar = state.variables.find(v => v.key === 'BASE_URL');
      const base = baseUrlVar ? baseUrlVar.value.trim() : (effectiveBaseUrl ? effectiveBaseUrl.trim() : '');
      
      if (base) {
        const cleanBase = base.replace(/\/+$/, '');
        const cleanPath = resolvedUrl.replace(/^\/+/, '');
        resolvedUrl = `${cleanBase}/${cleanPath}`;
      } else {
        dispatch(setResponse({
          status: 0,
          statusText: 'Validation Error',
          duration: 0,
          body: 'Relative URLs are not supported when BASE_URL is not set. Please define BASE_URL in the "Variables" tab or enter an absolute URL (starting with http:// or https://).',
          isJson: false,
          rawBody: 'Relative URLs are not supported when BASE_URL is not set. Please define BASE_URL in the "Variables" tab or enter an absolute URL (starting with http:// or https://).',
        }));
        return;
      }
    }

    const resolvedBody = resolveVariables(state.body, state.variables);

    // Validate JSON if request body is supported
    if (isBodyMethod && resolvedBody.trim()) {
      try {
        JSON.parse(resolvedBody);
      } catch (err) {
        let errMsg = err.message || 'Invalid JSON format';
        if (resolvedBody.includes("'")) {
          errMsg += ' (Hint: Use double quotes "..." for keys and strings instead of single quotes \'...\')';
        } else if (/,\s*}/.test(resolvedBody) || /,\s*]/.test(resolvedBody)) {
          errMsg += ' (Hint: Trailing commas are not allowed in JSON)';
        }
        setBodyError(errMsg);
        return;
      }
    }

    const reqHeaders = {};
    state.headers.forEach(h => {
      if (h.key.trim() && h.enabled !== false) {
        reqHeaders[h.key.trim()] = resolveVariables(h.value, state.variables);
      }
    });

    dispatch(setIsLoading(true));
    dispatch(clearResponse());
    const startTime = performance.now();

    try {
      const fetchOptions = {
        method: state.method,
        headers: reqHeaders,
      };

      if (isBodyMethod && resolvedBody.trim()) {
        fetchOptions.body = resolvedBody;
      }

      const res = await fetch(resolvedUrl, fetchOptions);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const status = res.status;
      const statusText = res.statusText || (status === 200 ? 'OK' : status === 201 ? 'Created' : '');
      const contentType = res.headers.get('content-type') || '';

      let text = '';
      try {
        text = await res.text();
      } catch (_) {}

      let parsedBody = text;
      let isJson = false;

      if (contentType.includes('application/json')) {
        try {
          parsedBody = JSON.parse(text);
          isJson = true;
        } catch (_) {}
      } else {
        try {
          parsedBody = JSON.parse(text);
          isJson = true;
        } catch (_) {}
      }

      const responseInfo = {
        status,
        statusText,
        duration,
        body: parsedBody,
        isJson,
        rawBody: text,
      };

      dispatch(setResponse(responseInfo));

      // Add to history list
      dispatch(addToHistory({
        method: state.method,
        urlPath: state.url,
        status,
        duration,
        body: state.body,
        headers: state.headers.filter(h => h.key.trim() || h.value.trim()),
      }));

    } catch (err) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const responseInfo = {
        status: 0,
        statusText: 'Error',
        duration,
        body: err.message || 'Failed to fetch',
        isJson: false,
        rawBody: err.message || 'Failed to fetch',
      };

      dispatch(setResponse(responseInfo));

      dispatch(addToHistory({
        method: state.method,
        urlPath: state.url,
        status: 'ERR',
        duration,
        body: state.body,
        headers: state.headers.filter(h => h.key.trim() || h.value.trim()),
      }));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  const hasBodyContent = state.body.trim().length > 0;
  const hasHeadersContent = state.headers.some(h => h.key.trim() || h.value.trim());
  const hasVariablesContent = state.variables.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-sidebar overflow-hidden select-none relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border-subtle flex-shrink-0 bg-sidebar">
        <div className="flex items-center gap-2">
          <Icons.Wifi className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.08em]">
            API Client
          </span>
        </div>
        {state.history.length > 0 && (
          <button
            onClick={() => dispatch(clearHistory())}
            className="w-7 h-7 rounded hover:bg-hover text-muted hover:text-danger transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
            title="Clear History"
          >
            <Icons.Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Request URL input Bar */}
      <RequestBar
        method={state.method}
        url={state.url}
        isLoading={state.isLoading}
        onSend={handleSend}
        resolvedUrl={getFullUrl()}
        hasUnresolvedVars={variablePills.some(vp => !vp.resolved)}
      />

      {/* Resolved URL Preview visualizer */}
      <div className="mx-3 mt-0 mb-3 px-2.5 py-1 rounded-md bg-background/50 border border-border-subtle/50 font-mono text-[11px] flex items-center gap-1.5 min-h-[24px] select-text overflow-hidden flex-shrink-0">
        <span className="text-muted/40 flex-shrink-0">&rsaquo;</span>
        <div className="truncate flex-1">
          {state.url.trim() ? (
            renderResolvedUrl(state.url, state.variables, effectiveBaseUrl)
          ) : (
            <span className="text-muted/40 italic">Enter a URL above</span>
          )}
        </div>
      </div>

      {/* Variable pills indicating resolution status */}
      {variablePills.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2 flex-shrink-0">
          {variablePills.map(vp => (
            <span
              key={vp.name}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono border font-semibold select-none
                ${vp.resolved
                  ? 'bg-success/5 border-success/15 text-success'
                  : 'bg-danger/5 border-danger/15 text-danger font-medium'
                }`}
            >
              {vp.name} {vp.resolved ? '✓' : '✗'}
            </span>
          ))}
        </div>
      )}

      {/* Request Tabs Switcher Bar */}
      <RequestTabs
        activeTab={state.activeTab}
        headerCount={state.headers.filter(h => h.key.trim() || h.value.trim()).length}
        hasBody={isBodyMethod}
        variableCount={state.variables.length}
      />

      {/* Active Tab Panel Body */}
      <div className="flex-shrink-0 bg-background">
        {state.activeTab === 'body' && isBodyMethod && (
          <BodyTab bodyError={bodyError} setBodyError={setBodyError} />
        )}
        {state.activeTab === 'headers' && (
          <HeadersTab />
        )}
        {state.activeTab === 'variables' && (
          <VariablesTab />
        )}
      </div>

      {/* Response Panel Body */}
      <ResponsePanel />

      {/* History Collapsible Panel */}
      <HistoryPanel />
    </div>
  );
}
