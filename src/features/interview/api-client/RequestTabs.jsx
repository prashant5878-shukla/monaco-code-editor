import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../../../store/apiClientSlice';

export function RequestTabs({ activeTab, headerCount, hasBody, variableCount }) {
  const dispatch = useDispatch();
  const bodyText = useSelector((s) => s.apiClient.body);
  const hasBodyContent = bodyText.trim().length > 0;

  return (
    <div className="flex h-8 bg-sidebar border-b border-border-subtle px-1 items-end gap-0 flex-shrink-0">
      {/* Body Tab (Visible only if method has body support) */}
      {hasBody && (
        <button
          onClick={() => dispatch(setActiveTab('body'))}
          className={`px-3 h-8 text-[11px] font-medium transition-colors border-none relative flex items-center gap-1.5 cursor-pointer
            ${activeTab === 'body'
              ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent after:rounded-t'
              : 'text-muted hover:text-secondary bg-transparent'}`}
        >
          <span>Body</span>
          {hasBodyContent && <span className="w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />}
        </button>
      )}

      {/* Headers Tab */}
      <button
        onClick={() => dispatch(setActiveTab('headers'))}
        className={`px-3 h-8 text-[11px] font-medium transition-colors border-none relative flex items-center gap-1.5 cursor-pointer
          ${activeTab === 'headers'
            ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent after:rounded-t'
            : 'text-muted hover:text-secondary bg-transparent'}`}
      >
        <span>Headers</span>
        {headerCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />}
      </button>

      {/* Variables Tab */}
      <button
        onClick={() => dispatch(setActiveTab('variables'))}
        className={`px-3 h-8 text-[11px] font-medium transition-colors border-none relative flex items-center gap-1.5 cursor-pointer
          ${activeTab === 'variables'
            ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent after:rounded-t'
            : 'text-muted hover:text-secondary bg-transparent'}`}
      >
        <span>Variables</span>
        {variableCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent/70 flex-shrink-0" />}
      </button>
    </div>
  );
}
