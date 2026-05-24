import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Icons } from '../../../lib/icons';

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
  // Escape HTML characters
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Highlighting regex matches
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

export function ResponsePanel() {
  const response = useSelector((s) => s.apiClient.response);
  const isLoading = useSelector((s) => s.apiClient.isLoading);
  const [copied, setCopied] = useState(false);

  const getResponseSize = (resp) => {
    if (!resp) return '0 B';
    const text = resp.isJson ? JSON.stringify(resp.body) : String(resp.rawBody || resp.body || '');
    const bytes = new Blob([text]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getResponseLines = () => {
    if (!response) return [];
    const text = response.isJson
      ? JSON.stringify(response.body, null, 2)
      : String(response.rawBody || response.body || '');
    return text.split('\n');
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

  const lines = getResponseLines();

  return (
    <div className="flex-1 overflow-hidden bg-background flex flex-col min-h-0">
      {/* Response Panel Header / Status Bar */}
      {!response ? (
        <div className="h-8 px-3 flex items-center text-[10px] font-semibold text-muted uppercase tracking-widest bg-sidebar border-y border-border-subtle flex-shrink-0 select-none">
          RESPONSE
        </div>
      ) : (
        <div className="h-8 flex items-center justify-between px-3 bg-sidebar border-y border-border-subtle text-[11px] font-mono flex-shrink-0 select-none whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-2">
            {/* Status Info */}
            <div className="flex items-center gap-1 select-text">
              <span className="text-muted">Status:</span>
              <span className={`font-semibold ${getStatusClasses(response.status).text}`}>
                {response.status} {response.statusText}
              </span>
            </div>

            <span className="text-border-subtle">|</span>

            {/* Response Size */}
            <div className="flex items-center gap-1 select-text">
              <span className="text-muted">Size:</span>
              <span className="text-secondary">{getResponseSize(response)}</span>
            </div>

            <span className="text-border-subtle">|</span>

            {/* Time Taken */}
            <div className="flex items-center gap-1 select-text">
              <span className="text-muted">Time:</span>
              <span className="text-secondary">{response.duration}ms</span>
            </div>
          </div>

          {/* Copy Button */}
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
      <div className="flex-1 overflow-hidden bg-background flex flex-col min-h-0 relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 select-none">
            <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <div className="text-[11px] text-muted/50 mt-1">Executing request...</div>
          </div>
        ) : !response ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 select-none px-6 text-center">
            <Icons.Send className="w-10 h-10 text-muted/15 rotate-45 transform" />
            <div className="text-[13px] font-medium text-muted/50">Send a request</div>
            <div className="text-[11px] text-muted/30">Response will appear here</div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-[#0d0d0d] font-mono text-[12px] leading-[1.6] mx-3 my-2 rounded-lg border border-border-subtle/40 select-text no-scrollbar">
            <div className="py-2">
              {lines.map((line, i) => (
                <div key={i} className="flex hover:bg-white/[0.03]">
                  {/* Line Number */}
                  <span className="w-9 text-right pr-3 text-muted/40 select-none flex-shrink-0 border-r border-border-subtle/30 py-px text-[11px]">
                    {i + 1}
                  </span>
                  {/* Highlighted Code Line */}
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
    </div>
  );
}
