import { useDispatch, useSelector } from 'react-redux';
import { Icons } from '../../../lib/icons';
import { setBody } from '../../../store/apiClientSlice';

export function BodyTab({ bodyError, setBodyError }) {
  const dispatch = useDispatch();
  const bodyText = useSelector((s) => s.apiClient.body);

  return (
    <div className={`flex flex-col border-b border-border-subtle bg-background ${bodyError ? 'border-b border-danger' : ''}`}>
      {/* Raw Body Textarea */}
      <textarea
        value={bodyText}
        onChange={e => {
          dispatch(setBody(e.target.value));
          if (setBodyError) setBodyError(null);
        }}
        placeholder={'{\n  "title": "Buy milk"\n}'}
        className="w-full min-h-[100px] max-h-[160px] font-mono text-[12px] text-primary leading-relaxed px-3 py-2 resize-none bg-transparent outline-none border-none select-text"
      />

      {/* JSON Validation Error Notification */}
      {bodyError && (
        <div className="text-[11px] text-danger font-medium leading-relaxed bg-danger/5 border-t border-danger/10 px-3 py-1.5 flex items-start gap-1 select-text">
          <Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{bodyError}</span>
        </div>
      )}
    </div>
  );
}
