import { useDispatch, useSelector } from 'react-redux';
import { Icons } from '../../../lib/icons';
import {
  addVariable,
  updateVariable,
  removeVariable,
} from '../../../store/apiClientSlice';

export function VariablesTab() {
  const dispatch = useDispatch();
  const variables = useSelector((s) => s.apiClient.variables);
  const url = useSelector((s) => s.apiClient.url);

  // Extract referenced variable keys from the active URL path
  const getUrlVariables = () => {
    const matches = [];
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = regex.exec(url)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const urlVariables = getUrlVariables();
  const isReferencedInUrl = (varKey) => {
    return varKey && urlVariables.includes(varKey);
  };

  return (
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
            <div
              key={v.id || i}
              className={`flex h-8 border-b border-border-subtle/30 group items-center select-text transition-all flex-shrink-0
                ${isRef ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
            >
              {/* Row Number */}
              <div className="w-8 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-mono text-muted/60">{i + 1}</span>
              </div>

              {/* Variable Key (always uppercase) */}
              <input
                type="text"
                placeholder="VARIABLE_NAME"
                value={v.key}
                onChange={e => dispatch(updateVariable({ id: v.id, field: 'key', value: e.target.value.toUpperCase() }))}
                className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-[#4fc1ff] uppercase placeholder:text-muted/30 border-none outline-none border-r border-border-subtle/30"
              />

              {/* Variable Value */}
              <input
                type="text"
                placeholder="value"
                value={v.value}
                onChange={e => dispatch(updateVariable({ id: v.id, field: 'value', value: e.target.value }))}
                className="flex-1 min-w-0 h-full px-3 bg-transparent font-mono text-[12px] text-secondary placeholder:text-muted/30 border-none outline-none"
              />

              {/* Remove Button */}
              <button
                onClick={() => dispatch(removeVariable(v.id))}
                className="w-7 h-full flex items-center justify-center flex-shrink-0 text-muted hover:text-danger cursor-pointer border-none bg-transparent transition-colors"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Variable Button (Fixed at Bottom of the panel) */}
      <div
        onClick={() => dispatch(addVariable())}
        className="h-7 flex items-center px-3 gap-1.5 text-[11px] text-muted hover:text-primary cursor-pointer transition-colors hover:bg-hover/20 select-none flex-shrink-0 border-t border-border-subtle/20"
      >
        <Icons.Plus className="w-3 h-3" />
        <span>Add variable</span>
      </div>
    </div>
  );
}
