import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Icons } from '../../../lib/icons';
import { setMethod, setUrl } from '../../../store/apiClientSlice';

const METHOD_BG_OPACITY_CLASSES = {
  GET: 'bg-[#4ec9b0]/15 text-[#4ec9b0]',
  POST: 'bg-[#569cd6]/15 text-[#569cd6]',
  PUT: 'bg-[#dcdcaa]/15 text-[#dcdcaa]',
  DELETE: 'bg-[#f48771]/15 text-[#f48771]',
  PATCH: 'bg-[#c586c0]/15 text-[#c586c0]'
};

export function RequestBar({ method, url, isLoading, onSend, resolvedUrl, hasUnresolvedVars }) {
  const dispatch = useDispatch();
  const [showMethodPopover, setShowMethodPopover] = useState(false);

  const activeMethodBgClass = METHOD_BG_OPACITY_CLASSES[method] || '';

  return (
    <div className="relative mx-3 my-3 flex-shrink-0">
      <div className="flex items-stretch h-9 rounded-lg overflow-hidden ring-1 ring-border-default focus-within:ring-accent transition-all bg-background">
        {/* Method Selector Dropdown Button */}
        <button
          onClick={() => setShowMethodPopover(!showMethodPopover)}
          className="flex items-center gap-1.5 px-3 h-full text-[11px] font-bold font-mono rounded-l-lg border-r border-border-subtle flex-shrink-0 bg-sidebar cursor-pointer select-none hover:bg-hover border-none"
        >
          <span className={`px-2 py-0.5 rounded ${activeMethodBgClass}`}>{method}</span>
          <Icons.ChevronRight className="w-3 h-3 text-muted rotate-90 transform transition-transform" />
        </button>

        {/* URL Input Box */}
        <input
          type="text"
          value={url}
          onChange={e => dispatch(setUrl(e.target.value))}
          placeholder="{{BASE_URL}}/api/todos"
          className="flex-1 bg-transparent px-3 font-mono text-[13px] text-primary placeholder:text-muted/40 outline-none border-none min-w-0"
        />

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!url.trim() || isLoading}
          className="flex-shrink-0 px-4 bg-accent text-white text-[12px] font-semibold hover:bg-accent-hover transition-colors rounded-none disabled:opacity-40 border-none cursor-pointer flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>

      {/* Popover overlay and items list */}
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
                    dispatch(setMethod(m));
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
  );
}
