import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Loader } from 'lucide-react';
import { LeftPanel } from './LeftPanel';
import { CandidateForm } from './CandidateForm';
import { SystemChecks } from './SystemChecks';
import { resetStart } from '../../store/startSlice';

export function StartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ── Redux state ───────────────────────────────────────────────────────────
  const { form, checks } = useSelector((s) => s.start);

  // ── Local non-serializable state ──────────────────────────────────────────
  const [resume, setResume] = useState(null);

  // ── Form status / loading states ──────────────────────────────────────────
  const [starting, setStarting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // ── Reset state on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      dispatch(resetStart());
    };
  }, [dispatch]);

  // ── Derived State: validation checks ──────────────────────────────────────
  const isFormValid =
    form.fullName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.experience !== '' &&
    form.resumeFileName !== '';

  const allSystemChecksPassed =
    Object.values(checks).every((status) => status === 'pass');

  const canStart = isFormValid && allSystemChecksPassed;

  // ── Handle start ─────────────────────────────────────────────────────────
  function handleStartClick() {
    if (starting) return;
    if (!canStart) {
      setShowWarning(true);
      return;
    }
    setStarting(true);
    setTimeout(() => {
      navigate('/editor', {
        state: {
          candidateName: form.fullName,
          candidateEmail: form.email,
        },
      });
    }, 800);
  }

  return (
    <div
      className="h-screen overflow-hidden flex"
      style={{
        background: "#0a0a0f",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Background gradient orbs ──────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "9999px",
          background: "rgba(59,130,246,0.04)",
          filter: "blur(120px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: "-200px",
          right: "-200px",
          width: "500px",
          height: "500px",
          borderRadius: "9999px",
          background: "rgba(168,85,247,0.03)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Inner layout ─────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col lg:flex-row w-full"
        style={{ zIndex: 10 }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            LEFT COLUMN — branding + scoring + guidelines
        ══════════════════════════════════════════════════════════════════ */}
        <LeftPanel />

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT COLUMN — form + checks + start
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 h-screen overflow-y-auto px-8 py-10 pb-16">
          <div className="w-full">
            {/* Greeting */}
            <h1 className="text-2xl font-bold text-white mb-1">
              Ready to begin?
            </h1>
            <p className="text-[14px] mb-8" style={{ color: "#6e7681" }}>
              Complete the steps below to start your interview.
            </p>

            {/* Step 1: Candidate Information */}
            <CandidateForm resume={resume} onResumeChange={setResume} />

            {/* Step 2: System Check */}
            <SystemChecks />

            {/* ── Validation warning ───────────────────────────────────── */}
            {showWarning && !canStart && (
              <p
                className="text-[11px] text-center mb-4"
                style={{ color: "#fbbf24" }}
              >
                Please complete all required fields and system checks
              </p>
            )}

            {/* ── Start button ─────────────────────────────────────────── */}
            <button
              id="start-interview-btn"
              onClick={handleStartClick}
              disabled={starting}
              className="w-full flex items-center justify-center gap-3 rounded-2xl
                         text-[15px] font-bold text-white transition-all duration-200"
              style={{
                height: "52px",
                background: "#3b82f6",
                opacity: starting ? 0.6 : canStart ? 1 : 0.4,
                cursor: starting ? "wait" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!starting) e.currentTarget.style.background = "#60a5fa";
              }}
              onMouseLeave={(e) => {
                if (!starting) e.currentTarget.style.background = "#3b82f6";
              }}
            >
              {starting ? (
                <>
                  <Loader
                    className="animate-spin"
                    style={{ width: "16px", height: "16px" }}
                  />
                  Preparing your environment...
                </>
              ) : (
                <>
                  <Play style={{ width: "20px", height: "20px" }} />
                  Start Interview
                </>
              )}
            </button>

            <p
              className="text-[11px] text-center mt-3"
              style={{ color: "#6e7681" }}
            >
              By starting, you agree that your session will be recorded for evaluation
            </p>
          </div>
        </div>
      </div>

      {/* ── Global styles ───────────────────────────────────────────────────── */}
      <style>{`
        input::placeholder, textarea::placeholder {
          color: rgba(110, 118, 129, 0.4);
        }
        select option { background: #111; color: #e6edf3; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
