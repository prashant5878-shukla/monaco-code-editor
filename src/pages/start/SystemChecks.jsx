import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Globe,
  Monitor,
  Database,
  Loader,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { setCheckStatus } from '../../store/startSlice';
import { CameraCard } from './CameraCard';
import { MicrophoneCard } from './MicrophoneCard';
import { ScreenShareCard } from './ScreenShareCard';

// ── Technical checks config (internet / browser / storage) ───────────────────
const TECH_CHECKS = [
  {
    id: "internet",
    Icon: Globe,
    label: "Internet Connection",
    delayMs: 400,
    run: async () => navigator.onLine,
  },
  {
    id: "browser",
    Icon: Monitor,
    label: "Browser Compatibility",
    delayMs: 700,
    run: async () => {
      try {
        return !!(window.fetch && window.localStorage && window.WebSocket);
      } catch {
        return false;
      }
    },
  },
  {
    id: "storage",
    Icon: Database,
    label: "Cookies & Storage",
    delayMs: 1000,
    run: async () => {
      try {
        localStorage.setItem("_ts_chk", "1");
        localStorage.removeItem("_ts_chk");
        return true;
      } catch {
        return false;
      }
    },
  },
];

function StepHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center
                   text-white text-[11px] font-bold flex-shrink-0"
        style={{ background: "#3b82f6" }}
      >
        {number}
      </div>
      <span className="text-[15px] font-semibold text-white">{title}</span>
    </div>
  );
}

function TechPill({ Icon, label, status }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        fontSize: "12px",
        color: "#9da1a6",
      }}
    >
      <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
      <span>{label}</span>
      {status === "checking" && (
        <Loader
          className="animate-spin"
          style={{
            width: "12px",
            height: "12px",
            color: "#6e7681",
            marginLeft: "2px",
          }}
        />
      )}
      {status === "pass" && (
        <CheckCircle
          style={{
            width: "13px",
            height: "13px",
            color: "#4ec9b0",
            marginLeft: "2px",
          }}
        />
      )}
      {status === "fail" && (
        <XCircle
          style={{
            width: "13px",
            height: "13px",
            color: "#f48771",
            marginLeft: "2px",
          }}
        />
      )}
    </div>
  );
}

export function SystemChecks() {
  const dispatch = useDispatch();
  const checks = useSelector((s) => s.start.checks);
  const [techComplete, setTechComplete] = useState(false);

  // ── Run technical checks on mount (staggered) ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const timers = [];

    TECH_CHECKS.forEach((cfg) => {
      // Set to checking first
      dispatch(setCheckStatus({ key: cfg.id, status: "checking" }));

      const t = setTimeout(async () => {
        if (cancelled) return;
        const result = await cfg.run();
        if (!cancelled) {
          dispatch(
            setCheckStatus({
              key: cfg.id,
              status: result ? "pass" : "fail",
            })
          );
        }
      }, cfg.delayMs);
      timers.push(t);
    });

    const lastDelay = Math.max(...TECH_CHECKS.map((c) => c.delayMs));
    const doneTimer = setTimeout(() => {
      if (!cancelled) setTechComplete(true);
    }, lastDelay + 300);
    timers.push(doneTimer);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [dispatch]);

  return (
    <div className="mb-8">
      <StepHeader number="2" title="System Check" />

      {/* ── Group 1: Technical pills ─────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {TECH_CHECKS.map((cfg) => (
          <TechPill
            key={cfg.id}
            Icon={cfg.Icon}
            label={cfg.label}
            status={checks[cfg.id]}
          />
        ))}
      </div>

      {/* ── Group 2: Media permissions ───────────────────────── */}
      <CameraCard startCheck={techComplete} />
      <MicrophoneCard startCheck={techComplete} />
      <ScreenShareCard />
    </div>
  );
}
