import { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons';

const METHOD_COLORS = {
  GET: 'text-[#4ec9b0]',
  POST: 'text-[#569cd6]',
  PUT: 'text-[#dcdcaa]',
  DELETE: 'text-[#f48771]',
  PATCH: 'text-[#c586c0]'
};

const METHOD_BG_OPACITY_CLASSES = {
  GET: 'bg-[#4ec9b0]/15 text-[#4ec9b0]',
  POST: 'bg-[#569cd6]/15 text-[#569cd6]',
  PUT: 'bg-[#dcdcaa]/15 text-[#dcdcaa]',
  DELETE: 'bg-[#f48771]/15 text-[#f48771]',
  PATCH: 'bg-[#c586c0]/15 text-[#c586c0]'
};

const getStatusClasses = (status) => {
  if (typeof status !== 'number') return { text: 'text-[#f48771]', bg: 'bg-[#f48771]' };
  if (status >= 200 && status < 300) return { text: 'text-[#4ec9b0]', bg: 'bg-[#4ec9b0]' };
  if (status >= 300 && status < 400) return { text: 'text-[#dcdcaa]', bg: 'bg-[#dcdcaa]' };
  return { text: 'text-[#f48771]', bg: 'bg-[#f48771]' };
};

function highlightJson(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  // Escape HTML tags to prevent cross-site scripting/rendering issues
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Syntax highlight regex patterns
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    let cls = 'text-[#b5cea8]'; // numbers
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-[#9cdcfe]'; // keys
      } else {
        cls = 'text-[#ce9178]'; // strings
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-[#569cd6]'; // booleans
    } else if (/null/.test(match)) {
      cls = 'text-[#569cd6]'; // null
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

function resolveVariables(str, variables) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const found = variables.find(v => v.key === key);
    return found ? found.value : `{{${key}}}`; // leave unresolved if not found
  });
}

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
  const [method, setMethod] = useState('GET');
  const [urlPath, setUrlPath] = useState('');
  const [activeTab, setActiveTab] = useState('headers');
  const [bodyText, setBodyText] = useState('');
  const [bodyError, setBodyError] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showMethodPopover, setShowMethodPopover] = useState(false);
  
  const effectiveBaseUrl = baseUrl || previewUrl;

  // Environment variables state (purely in-memory, zero browser storage)
  const [variables, setVariables] = useState(() => {
    return effectiveBaseUrl ? [{ id: 1, key: 'BASE_URL', value: effectiveBaseUrl }] : [];
  });

  // When effectiveBaseUrl changes, auto-update BASE_URL variable if not manually edited
  useEffect(() => {
    if (!effectiveBaseUrl) return;
    setVariables(prev => {
      const hasBaseUrl = prev.find(v => v.key === 'BASE_URL');
      if (!hasBaseUrl) {
        return [{ id: Date.now(), key: 'BASE_URL', value: effectiveBaseUrl }, ...prev];
      }
      return prev.map(v => v.key === 'BASE_URL' && !v.manuallyEdited
        ? { ...v, value: effectiveBaseUrl }
        : v
      );
    });
  }, [effectiveBaseUrl]);
  
  // State for headers rows (with enabled field)
  const [headers, setHeaders] = useState([
    { key: '', value: '', enabled: true }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);

  // Request history (purely in-memory, zero browser storage)
  const [history, setHistory] = useState([]);

  const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(method);

  // Manage tab fallback when body tab is hidden
  useEffect(() => {
    if (!isBodyMethod && activeTab === 'body') {
      setActiveTab('headers');
    }
  }, [method, isBodyMethod, activeTab]);

  // Pre-fill Content-Type: application/json when body tab is active
  useEffect(() => {
    if (isBodyMethod) {
      const hasContentType = headers.some(h => h.key.toLowerCase() === 'content-type');
      if (!hasContentType) {
        const filtered = headers.filter(h => h.key.trim() || h.value.trim());
        setHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }, ...filtered]);
      }
    }
  }, [method, isBodyMethod]);

  const getFullUrl = () => {
    return resolveVariables(urlPath, variables);
  };

  const getUrlVariables = () => {
    const matches = [];
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = regex.exec(urlPath)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const urlVariables = getUrlVariables();
  const variablePills = urlVariables.map(name => {
    const found = variables.find(v => v.key === name);
    return { name, resolved: !!found };
  });

  const isReferencedInUrl = (varKey) => {
    return varKey && urlVariables.includes(varKey);
  };

  const handleAddHeader = () => {
    setHeaders(prev => [{ key: '', value: '', enabled: true }, ...prev]);
  };

  const handleUpdateHeader = (index, field, value) => {
    setHeaders(prev => prev.map((h, idx) => {
      if (idx === index) {
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const handleRemoveHeader = (index) => {
    setHeaders(prev => prev.filter((_, idx) => idx !== index));
  };

  // Variable Actions
  const handleAddVariable = () => {
    setVariables(prev => [{ id: Date.now(), key: '', value: '', manuallyEdited: true }, ...prev]);
  };

  const handleUpdateVariableKey = (index, key) => {
    const uppercaseKey = key.toUpperCase();
    setVariables(prev => prev.map((v, idx) => {
      if (idx === index) {
        return { ...v, key: uppercaseKey, manuallyEdited: true };
      }
      return v;
    }));
  };

  const handleUpdateVariableValue = (index, value) => {
    setVariables(prev => prev.map((v, idx) => {
      if (idx === index) {
        return { ...v, value, manuallyEdited: true };
      }
      return v;
    }));
  };

  const handleRemoveVariable = (index) => {
    setVariables(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCopy = () => {
    if (!response) return;
    const textToCopy = response.isJson
      ? JSON.stringify(response.body, null, 2)
      : response.rawBody;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const restoreRequest = (item) => {
    setMethod(item.method);
    setUrlPath(item.urlPath);
    setBodyText(item.body || '');
    setHeaders(item.headers && item.headers.length > 0
      ? item.headers.map(h => ({ ...h, enabled: h.enabled !== false }))
      : [{ key: '', value: '', enabled: true }]
    );
    setBodyError(null);
  };

  const handleSend = async () => {
    if (!urlPath.trim()) return;
    setBodyError(null);

    let resolvedUrl = getFullUrl();
    
    // Safety check for relative URLs: Prepend BASE_URL or effectiveBaseUrl if present
    if (!/^https?:\/\//i.test(resolvedUrl)) {
      const baseUrlVar = variables.find(v => v.key === 'BASE_URL');
      const base = baseUrlVar ? baseUrlVar.value.trim() : (effectiveBaseUrl ? effectiveBaseUrl.trim() : '');
      
      if (base) {
        const cleanBase = base.replace(/\/+$/, '');
        const cleanPath = resolvedUrl.replace(/^\/+/, '');
        resolvedUrl = `${cleanBase}/${cleanPath}`;
      } else {
        // Prevent fallbacks onto the local host application
        setResponse({
          status: 0,
          statusText: 'Validation Error',
          duration: 0,
          body: 'Relative URLs are not supported when BASE_URL is not set. Please define BASE_URL in the "Variables" tab or enter an absolute URL (starting with http:// or https://).',
          isJson: false,
          rawBody: 'Relative URLs are not supported when BASE_URL is not set. Please define BASE_URL in the "Variables" tab or enter an absolute URL (starting with http:// or https://).',
        });
        return;
      }
    }

    const resolvedBody = resolveVariables(bodyText, variables);

    // Validate JSON if Body is supported
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
    headers.forEach(h => {
      if (h.key.trim() && h.enabled !== false) {
        reqHeaders[h.key.trim()] = resolveVariables(h.value, variables);
      }
    });

    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      const fetchOptions = {
        method,
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

      setResponse(responseInfo);

      // Add to history
      setHistory(prev => {
        const item = {
          method,
          urlPath,
          status,
          duration,
          body: bodyText,
          headers: headers.filter(h => h.key.trim() || h.value.trim()),
        };
        return [item, ...prev].slice(0, 10);
      });

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

      setResponse(responseInfo);

      setHistory(prev => {
        const item = {
          method,
          urlPath,
          status: 'ERR',
          duration,
          body: bodyText,
          headers: headers.filter(h => h.key.trim() || h.value.trim()),
        };
        return [item, ...prev].slice(0, 10);
      });
    } finally {
      setLoading(false);
    }
  };

  const hasBodyContent = bodyText.trim().length > 0;
  const hasHeadersContent = headers.some(h => h.key.trim() || h.value.trim());
  const hasVariablesContent = variables.length > 0;

  // Calculate size from response body string helper
  const getResponseSize = (resp) => {
    if (!resp) return '0 B';
    const text = resp.isJson ? JSON.stringify(resp.body) : String(resp.rawBody || resp.body || '');
    const bytes = new Blob([text]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Split pretty-printed JSON by \n to get lines array helper
  const getResponseLines = () => {
    if (!response) return [];
    const text = response.isJson
      ? JSON.stringify(response.body, null, 2)
      : String(response.rawBody || response.body || '');
    return text.split('\n');
  };

  const lines = getResponseLines();
  const activeMethodBgClass = METHOD_BG_OPACITY_CLASSES[method] || '';

  return (
    <div className="w-full h-full flex flex-col bg-sidebar overflow-hidden select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border-subtle flex-shrink-0 bg-sidebar">
        <div className="flex items-center gap-2">
          <Icons.Wifi className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.08em]">
            API Client
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setHistory([])}
            className="w-7 h-7 rounded hover:bg-hover text-muted hover:text-danger transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
            title="Clear History"
          >
            <Icons.Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Request Bar */}
      <div className="relative mx-3 my-3 flex-shrink-0">
        <div className="flex items-stretch h-9 rounded-lg overflow-hidden ring-1 ring-border-default focus-within:ring-accent transition-all bg-background">
          <button
            onClick={() => setShowMethodPopover(!showMethodPopover)}
            className="flex items-center gap-1.5 px-3 h-full text-[11px] font-bold font-mono rounded-l-lg border-r border-border-subtle flex-shrink-0 bg-sidebar cursor-pointer select-none hover:bg-hover border-none"
          >
            <span className={`px-2 py-0.5 rounded ${activeMethodBgClass}`}>{method}</span>
            <Icons.ChevronRight className="w-3 h-3 text-muted rotate-90 transform transition-transform" />
          </button>

          <input
            type="text"
            value={urlPath}
            onChange={e => setUrlPath(e.target.value)}
            placeholder="{{BASE_URL}}/api/todos"
            className="flex-1 bg-transparent px-3 font-mono text-[13px] text-primary placeholder:text-muted/40 outline-none border-none min-w-0"
          />

          <button
            onClick={handleSend}
            disabled={!urlPath.trim() || loading}
            className="flex-shrink-0 px-4 bg-accent text-white text-[12px] font-semibold hover:bg-accent-hover transition-colors rounded-none disabled:opacity-40 border-none cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>

        {showMethodPopover && (
          <>
            <div 
              className="fixed inset-0 z-50 cursor-default" 
              onClick={() => setShowMethodPopover(false)} 
            />
            <div className="absolute left-0 top-10 w-28 bg-[#1e1e1e] border border-border-subtle rounded-md shadow-lg z-50 py-1 overflow-hidden select-none">
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => {
                const active = m === method;
                const mColor = METHOD_BG_OPACITY_CLASSES[m] || '';
                return (
                  <div
                    key={m}
                    onClick={() => {
                      setMethod(m);
                      setShowMethodPopover(false);
                    }}
                    className={`px-3 py-1.5 text-[11px] font-mono font-bold cursor-pointer hover:bg-hover flex items-center justify-between
                      ${active ? 'bg-hover' : ''}`}
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] ${mColor}`}>{m}</span>
                    {active && <Icons.Check className="w-3 h-3 text-accent" />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Resolved URL Preview */}
      <div className="mx-3 mt-0 mb-3 px-2.5 py-1 rounded-md bg-background/50 border border-border-subtle/50 font-mono text-[11px] flex items-center gap-1.5 min-h-[24px] select-text overflow-hidden flex-shrink-0">
        <span className="text-muted/40 flex-shrink-0">&rsaquo;</span>
        <div className="truncate flex-1">
          {urlPath.trim() ? (
            renderResolvedUrl(urlPath, variables, effectiveBaseUrl)
          ) : (
            <span className="text-muted/40 italic">Enter a URL above</span>
          )}
        </div>
      </div>

      {/* Variable pills indicating resolution */}
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

      {/* Request Tabs switcher */}
      <div className="flex h-8 bg-sidebar border-b border-border-subtle px-1 items-end gap-0 flex-shrink-0">
        {isBodyMethod && (
          <button
            onClick={() => setActiveTab('body')}
            className={`px-3 h-8 text-[11px] font-medium transition-colors border-none relative flex items-center gap-1.5 cursor-pointer
              ${activeTab === 'body'
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent after:rounded-t'
                : 'text-muted hover:text-secondary bg-transparent'}`}
          >
            <span>Body</span>
            {hasBodyContent && <span className="w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />}
          </button>
        )}
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-3 h-8 text-[11px] font-medium transition-colors border-none relative flex items-center gap-1.5 cursor-pointer
            ${activeTab === 'headers'
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent after:rounded-t'
              : 'text-muted hover:text-secondary bg-transparent'}`}
        >
          <span>Headers</span>
          {hasHeadersContent && <span className="w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />}
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`px-3 h-8 text-[11px] font-medium transition-colors border-none relative flex items-center gap-1.5 cursor-pointer
            ${activeTab === 'variables'
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent after:rounded-t'
              : 'text-muted hover:text-secondary bg-transparent'}`}
        >
          <span>Variables</span>
          {hasVariablesContent && <span className="w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />}
        </button>
      </div>

      {/* Request Content Panels */}
      <div className="flex-shrink-0 bg-background">
        {/* Body Panel */}
        {activeTab === 'body' && isBodyMethod && (
          <div className={`flex flex-col border-b border-border-subtle bg-background ${bodyError ? 'border-b border-danger' : ''}`}>
            <textarea
              value={bodyText}
              onChange={e => {
                setBodyText(e.target.value);
                setBodyError(null);
              }}
              placeholder={'{\n  "title": "Buy milk"\n}'}
              className="w-full min-h-[100px] max-h-[160px] font-mono text-[12px] text-primary leading-relaxed px-3 py-2 resize-none bg-transparent outline-none border-none select-text"
            />
            {bodyError && (
              <div className="text-[11px] text-danger font-medium leading-relaxed bg-danger/5 border-t border-danger/10 px-3 py-1.5 flex items-start gap-1 select-text">
                <Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{bodyError}</span>
              </div>
            )}
          </div>
        )}

        {/* Headers Panel */}
        {activeTab === 'headers' && (
          <div className="flex flex-col bg-background border-b border-border-subtle/50">
            {/* Table Header (Fixed) */}
            <div className="h-7 flex items-center border-b border-border-subtle bg-sidebar text-[10px] text-muted uppercase tracking-wider select-none flex-shrink-0">
              <div className="w-8 flex items-center justify-center font-bold">#</div>
              <div className="flex-1 px-3 border-r border-border-subtle/30 h-full flex items-center font-bold">Key</div>
              <div className="flex-1 px-3 h-full flex items-center font-bold">Value</div>
              <div className="w-7 flex-shrink-0" />
            </div>

            {/* Scrollable Rows Container */}
            <div className="max-h-[120px] overflow-y-auto no-scrollbar flex flex-col">
              {headers.map((h, i) => {
                const isEnabled = h.enabled !== false;
                return (
                  <div
                    key={i}
                    className={`h-8 flex items-center border-b border-border-subtle/30 group select-text transition-opacity flex-shrink-0
                      ${!isEnabled ? 'opacity-40' : ''}`}
                  >
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => {
                          setHeaders(prev => prev.map((item, idx) => idx === i ? { ...item, enabled: !isEnabled } : item));
                        }}
                        className="w-3 h-3 accent-accent cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Key"
                      value={h.key}
                      onChange={e => handleUpdateHeader(i, 'key', e.target.value)}
                      className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-[#9cdcfe] placeholder:text-muted/25 border-none outline-none border-r border-border-subtle/30"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={h.value}
                      onChange={e => handleUpdateHeader(i, 'value', e.target.value)}
                      className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-[#ce9178] placeholder:text-muted/25 border-none outline-none"
                    />
                    <button
                      onClick={() => handleRemoveHeader(i)}
                      className="w-7 h-full flex items-center justify-center flex-shrink-0 text-muted hover:text-danger cursor-pointer border-none bg-transparent transition-colors"
                    >
                      <Icons.X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Button (Fixed at Bottom of the panel) */}
            <div
              onClick={handleAddHeader}
              className="h-7 flex items-center px-3 gap-1.5 text-[11px] text-muted hover:text-primary cursor-pointer transition-colors hover:bg-hover/20 select-none flex-shrink-0 border-t border-border-subtle/20"
            >
              <Icons.Plus className="w-3 h-3" />
              <span>Add header</span>
            </div>
          </div>
        )}

        {/* Variables Panel */}
        {activeTab === 'variables' && (
          <div className="flex flex-col bg-background border-b border-border-subtle/50">
            {/* Table Header (Fixed) */}
            <div className="h-7 flex items-center border-b border-border-subtle bg-sidebar text-[10px] text-muted uppercase tracking-wider select-none flex-shrink-0">
              <div className="w-8 flex items-center justify-center font-bold">#</div>
              <div className="flex-1 px-3 border-r border-border-subtle/30 h-full flex items-center font-bold">Variable</div>
              <div className="flex-1 px-3 h-full flex items-center font-bold">Value</div>
              <div className="w-7 flex-shrink-0" />
            </div>

            {/* Scrollable Rows Container */}
            <div className="max-h-[120px] overflow-y-auto no-scrollbar flex flex-col">
              {variables.map((v, i) => {
                const isRef = isReferencedInUrl(v.key);
                return (
                  <div key={v.id || i} className={`flex h-8 border-b border-border-subtle/30 group items-center select-text transition-all flex-shrink-0
                    ${isRef ? 'bg-accent/5 border-l-2 border-accent' : ''}`}>
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-mono text-muted/60">{i + 1}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="VARIABLE_NAME"
                      value={v.key}
                      onChange={e => handleUpdateVariableKey(i, e.target.value)}
                      className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-[#4fc1ff] uppercase placeholder:text-muted/30 border-none outline-none border-r border-border-subtle/30"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={v.value}
                      onChange={e => handleUpdateVariableValue(i, e.target.value)}
                      className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-secondary placeholder:text-muted/30 border-none outline-none"
                    />
                    <button
                      onClick={() => handleRemoveVariable(i)}
                      className="w-7 h-full flex items-center justify-center flex-shrink-0 text-muted hover:text-danger cursor-pointer border-none bg-transparent transition-colors"
                    >
                      <Icons.X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Button (Fixed at Bottom of the panel) */}
            <div
              onClick={handleAddVariable}
              className="h-7 flex items-center px-3 gap-1.5 text-[11px] text-muted hover:text-primary cursor-pointer transition-colors hover:bg-hover/20 select-none flex-shrink-0 border-t border-border-subtle/20"
            >
              <Icons.Plus className="w-3 h-3" />
              <span>Add variable</span>
            </div>
          </div>
        )}
      </div>

      {/* Response Panel Header / Status Bar */}
      {!response ? (
        <div className="h-8 px-3 flex items-center text-[10px] font-semibold text-muted uppercase tracking-widest bg-sidebar border-y border-border-subtle flex-shrink-0 select-none">
          RESPONSE
        </div>
      ) : (
        <div className="h-8 flex items-center justify-between px-3 bg-sidebar border-y border-border-subtle text-[11px] font-mono flex-shrink-0 select-none whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 select-text">
              <span className="text-muted">Status:</span>
              <span className={`font-semibold ${getStatusClasses(response.status).text}`}>
                {response.status} {response.statusText}
              </span>
            </div>

            <span className="text-border-subtle">|</span>

            <div className="flex items-center gap-1 select-text">
              <span className="text-muted">Size:</span>
              <span className="text-secondary">{getResponseSize(response)}</span>
            </div>

            <span className="text-border-subtle">|</span>

            <div className="flex items-center gap-1 select-text">
              <span className="text-muted">Time:</span>
              <span className="text-secondary">{response.duration}ms</span>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-primary hover:bg-hover transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
            title="Copy response body"
          >
            {copied ? (
              <Icons.Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Icons.Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Response Content Panel */}
      <div className="flex-1 overflow-hidden bg-background flex flex-col min-h-0">
        {!response ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 select-none px-6 text-center">
            <Icons.Send className="w-10 h-10 text-muted/15 rotate-45 transform" />
            <div className="text-[13px] font-medium text-muted/50">Send a request</div>
            <div className="text-[11px] text-muted/30">Response will appear here</div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-[#0d0d0d] font-mono text-[12px] leading-[1.6] mx-3 my-2 rounded-lg border border-border-subtle/40 select-text">
            <div className="py-2">
              {lines.map((line, i) => (
                <div key={i} className="flex hover:bg-white/[0.03]">
                  <span className="w-9 text-right pr-3 text-muted/40 select-none flex-shrink-0 border-r border-border-subtle/30 py-px text-[11px]">
                    {i + 1}
                  </span>
                  <span
                    className="px-3 py-px whitespace-pre break-all"
                    dangerouslySetInnerHTML={{
                      __html: response.isJson
                        ? highlightJson(line)
                        : line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible History Section */}
      <div className="border-t border-border-subtle flex-shrink-0 flex flex-col bg-sidebar">
        <div
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="h-8 flex items-center justify-between px-3 bg-sidebar cursor-pointer hover:bg-hover transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.1em]">History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                {history.length}
              </span>
            )}
          </div>
          <Icons.ChevronRight
            className={`w-3.5 h-3.5 text-muted transition-transform duration-200
              ${historyExpanded ? 'rotate-90' : ''}`}
          />
        </div>

        {historyExpanded && (
          <div className="max-h-[150px] overflow-y-auto no-scrollbar bg-background/20 select-none border-t border-border-subtle/30">
            {history.length === 0 ? (
              <div className="text-center text-muted/60 py-4 text-xs italic">
                No request history
              </div>
            ) : (
              <div className="flex flex-col">
                {history.map((item, idx) => {
                  const isErr = item.status === 'ERR' || item.status === 0;
                  const statusInfo = getStatusClasses(item.status);
                  const badgeClasses = METHOD_BG_OPACITY_CLASSES[item.method] || 'bg-background/80 text-primary';

                  return (
                    <div
                      key={idx}
                      onClick={() => restoreRequest(item)}
                      className="h-9 flex items-center gap-2.5 px-3 border-b border-border-subtle/30 hover:bg-hover cursor-pointer transition-colors"
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex-shrink-0 text-center ${badgeClasses}`}>
                        {item.method}
                      </span>

                      <span className="flex-1 font-mono text-secondary truncate text-[11px]" title={item.urlPath}>
                        {item.urlPath}
                      </span>

                      <span className={`font-mono w-8 text-[11px] font-semibold flex-shrink-0 ${isErr ? 'text-[#f48771]' : statusInfo.text}`}>
                        {item.status}
                      </span>

                      <span className="font-mono text-muted text-[10px] flex-shrink-0 w-9 text-right ml-auto">
                        {item.duration}ms
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
