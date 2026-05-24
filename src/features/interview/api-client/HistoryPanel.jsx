import { useDispatch, useSelector } from 'react-redux';
import { Icons } from '../../../lib/icons';
import { toggleHistory, restoreFromHistory } from '../../../store/apiClientSlice';

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

export function HistoryPanel() {
  const dispatch = useDispatch();
  const history = useSelector((s) => s.apiClient.history);
  const historyOpen = useSelector((s) => s.apiClient.historyOpen);

  return (
    <div className="border-t border-border-subtle flex-shrink-0 flex flex-col bg-sidebar">
      {/* Clickable Header Row */}
      <div
        onClick={() => dispatch(toggleHistory())}
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
            ${historyOpen ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Collapsible history rows */}
      {historyOpen && (
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
                    onClick={() => dispatch(restoreFromHistory(item))}
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
  );
}
