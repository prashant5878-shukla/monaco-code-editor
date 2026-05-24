import { Zap } from 'lucide-react';

const SCORES = [
  { icon: '🧪', label: 'Test Cases',       pct: 30 },
  { icon: '🔍', label: 'Lighthouse Audit', pct: 30 },
  { icon: '📊', label: 'Code Analysis',    pct: 20 },
  { icon: '🎤', label: 'Viva Questions',   pct: 20 },
];

const RULES = [
  'You have 45 minutes once the timer starts. It cannot be paused.',
  'Your code runs in a secure cloud sandbox — no local setup needed.',
  'AI assistance is available but your process is being analyzed.',
  'After submission you will answer 2 viva questions about your code.',
  'Ensure a stable internet connection before starting.',
];

export function LeftPanel() {
  return (
    <div
      className="lg:w-[450px] flex-shrink-0 flex flex-col h-screen overflow-y-auto px-8 py-10"
      style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#3b82f6' }}
        >
          <Zap style={{ width: '16px', height: '16px', color: '#fff' }} />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none">
            TechScreen
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: '#6e7681' }}>
            AI-Powered Technical Interviews
          </p>
        </div>
      </div>

      {/* Challenge hidden card */}
      <div
        className="mt-8 p-5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="text-2xl mb-3">🔒</div>
        <p className="text-[15px] font-semibold text-white mb-1">
          Challenge details will be revealed
        </p>
        <p className="text-[13px]" style={{ color: '#6e7681' }}>
          once you enter the interview environment.
        </p>
      </div>

      {/* Scoring */}
      <div
        className="mt-6 p-5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <p
          className="text-[10px] uppercase mb-3"
          style={{ color: '#6e7681', letterSpacing: '0.1em' }}
        >
          SCORING
        </p>
        {SCORES.map(({ icon, label, pct }) => (
          <div key={label}>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[13px]" style={{ color: '#9da1a6' }}>
                {icon} {label}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                style={{
                  color: '#3b82f6',
                  background: 'rgba(59,130,246,0.10)',
                }}
              >
                {pct}%
              </span>
            </div>
            <div
              className="h-[2px] w-full rounded-full mt-0.5 mb-1"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: 'rgba(59,130,246,0.40)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Guidelines */}
      <div className="mt-6">
        <p
          className="text-[10px] uppercase mb-4"
          style={{ color: '#6e7681', letterSpacing: '0.15em' }}
        >
          GUIDELINES
        </p>
        {RULES.map((rule, i) => (
          <div key={i} className="flex items-start gap-3 mb-3">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ background: 'rgba(59,130,246,0.60)' }}
            />
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: '#9da1a6' }}
            >
              {rule}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
