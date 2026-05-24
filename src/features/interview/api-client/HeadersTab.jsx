import { useDispatch, useSelector } from 'react-redux';
import { Icons } from '../../../lib/icons';
import {
  addHeader,
  updateHeader,
  toggleHeader,
  removeHeader,
} from '../../../store/apiClientSlice';

export function HeadersTab() {
  const dispatch = useDispatch();
  const headers = useSelector((s) => s.apiClient.headers);

  return (
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
              key={h.id || i}
              className={`h-8 flex items-center border-b border-border-subtle/30 group select-text transition-opacity flex-shrink-0
                ${!isEnabled ? 'opacity-40' : ''}`}
            >
              {/* Checkbox (toggle enabled state) */}
              <div className="w-8 flex items-center justify-center flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => dispatch(toggleHeader(h.id))}
                  className="w-3 h-3 accent-accent cursor-pointer"
                />
              </div>

              {/* Key Input */}
              <input
                type="text"
                placeholder="Key"
                value={h.key}
                onChange={e => dispatch(updateHeader({ id: h.id, field: 'key', value: e.target.value }))}
                className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-[#9cdcfe] placeholder:text-muted/25 border-none outline-none border-r border-border-subtle/30"
              />

              {/* Value Input */}
              <input
                type="text"
                placeholder="Value"
                value={h.value}
                onChange={e => dispatch(updateHeader({ id: h.id, field: 'value', value: e.target.value }))}
                className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-[#ce9178] placeholder:text-muted/25 border-none outline-none"
              />

              {/* Delete Button */}
              <button
                onClick={() => dispatch(removeHeader(h.id))}
                className="w-7 h-full flex items-center justify-center flex-shrink-0 text-muted hover:text-danger cursor-pointer border-none bg-transparent transition-colors"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Header Button (Fixed at Bottom of the panel) */}
      <div
        onClick={() => dispatch(addHeader())}
        className="h-7 flex items-center px-3 gap-1.5 text-[11px] text-muted hover:text-primary cursor-pointer transition-colors hover:bg-hover/20 select-none flex-shrink-0 border-t border-border-subtle/20"
      >
        <Icons.Plus className="w-3 h-3" />
        <span>Add header</span>
      </div>
    </div>
  );
}
