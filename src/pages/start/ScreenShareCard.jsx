import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Cast, Monitor, Loader } from 'lucide-react';
import { setCheckStatus } from '../../store/startSlice';

function MediaCardHeader({ Icon, label, status }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <Icon style={{ width: "15px", height: "15px", color: "#9da1a6" }} />
        <span className="text-[13px] font-medium text-white">{label}</span>
      </div>
      {status === "requesting" && (
        <span className="text-[11px]" style={{ color: "#6e7681" }}>
          Requesting...
        </span>
      )}
      {status === "pass" && (
        <span
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "#4ec9b0" }}
        >
          <span
            className="animate-pulse"
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "9999px",
              background: "#4ec9b0",
            }}
          />
          Live
        </span>
      )}
      {status === "fail" && (
        <span className="text-[11px]" style={{ color: "#f48771" }}>
          ✕ Denied
        </span>
      )}
      {status === "idle" && (
        <span className="text-[11px]" style={{ color: "#6e7681" }}>
          Waiting
        </span>
      )}
    </div>
  );
}

export function ScreenShareCard() {
  const dispatch = useDispatch();
  const screenStatus = useSelector((s) => s.start.checks.screenShare);
  const screenRef = useRef(null);
  const [screenStream, setScreenStream] = useState(null);

  async function requestScreen() {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    dispatch(setCheckStatus({ key: "screenShare", status: "requesting" }));
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setScreenStream(stream);
      dispatch(setCheckStatus({ key: "screenShare", status: "pass" }));
      if (screenRef.current) screenRef.current.srcObject = stream;

      // Handle user stopping share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        dispatch(setCheckStatus({ key: "screenShare", status: "idle" }));
        setScreenStream(null);
      };
    } catch {
      dispatch(setCheckStatus({ key: "screenShare", status: "fail" }));
    }
  }

  function stopScreen() {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    setScreenStream(null);
    dispatch(setCheckStatus({ key: "screenShare", status: "idle" }));
  }

  // Attach stream to video element
  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [screenStream]);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-1"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <MediaCardHeader
        Icon={Cast}
        label="Screen Share"
        status={screenStatus}
      />

      {/* Idle / prompt state */}
      {(screenStatus === "idle" || screenStatus === "fail") && (
        <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
          <Cast
            style={{
              width: "36px",
              height: "36px",
              color: "rgba(110,118,129,0.3)",
              marginBottom: "2px",
            }}
          />
          <p className="text-[13px]" style={{ color: "#9da1a6" }}>
            Share your screen to continue
          </p>
          <p className="text-[11px]" style={{ color: "#6e7681" }}>
            The interviewer will see your screen during the session
          </p>
          {screenStatus === "fail" && (
            <p className="text-[11px]" style={{ color: "#f48771" }}>
              Permission denied — please try again
            </p>
          )}
          <button
            onClick={requestScreen}
            className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{
              background: "#3b82f6",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#60a5fa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
            }}
          >
            <Monitor style={{ width: "15px", height: "15px" }} />
            Share Screen
          </button>
        </div>
      )}

      {/* Requesting */}
      {screenStatus === "requesting" && (
        <div
          className="flex items-center justify-center"
          style={{ aspectRatio: "16/9", background: "#0a0a0f" }}
        >
          <Loader
            className="animate-spin"
            style={{
              width: "24px",
              height: "24px",
              color: "rgba(110,118,129,0.4)",
            }}
          />
        </div>
      )}

      {/* Live preview */}
      {screenStatus === "pass" && (
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: "16/9", background: "#0a0a0f" }}
        >
          <video
            ref={screenRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Active badge */}
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-white"
            style={{
              background: "rgba(0,0,0,0.60)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              className="animate-pulse"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "9999px",
                background: "#4ec9b0",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            Screen sharing active
          </div>
          {/* Stop button */}
          <button
            onClick={stopScreen}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] text-white transition-colors"
            style={{
              background: "rgba(0,0,0,0.60)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.10)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.80)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.80)";
            }}
          >
            Stop Sharing
          </button>
        </div>
      )}
    </div>
  );
}
