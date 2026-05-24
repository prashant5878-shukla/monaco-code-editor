import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mic, MicOff, Loader } from 'lucide-react';
import { setCheckStatus, setAudioLevel } from '../../store/startSlice';

export function MicrophoneCard({ startCheck }) {
  const dispatch = useDispatch();
  const micStatus = useSelector((s) => s.start.checks.microphone);
  const audioLevel = useSelector((s) => s.start.audioLevel);

  const [micStream, setMicStream] = useState(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  const requestMic = useCallback(async () => {
    // Tear down any existing analyser
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) {
      try {
        await audioCtxRef.current.close();
      } catch {}
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
    }

    dispatch(setCheckStatus({ key: "microphone", status: "requesting" }));
    dispatch(setAudioLevel(0));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      function tick() {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        dispatch(setAudioLevel(Math.min(100, Math.round(avg * 2))));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
      dispatch(setCheckStatus({ key: "microphone", status: "pass" }));
    } catch {
      setMicStream(null);
      dispatch(setCheckStatus({ key: "microphone", status: "fail" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micStream, dispatch]);

  // Request on startCheck trigger
  useEffect(() => {
    if (startCheck && micStatus === "idle") {
      requestMic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [micStream]);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Mic style={{ width: "16px", height: "16px", color: "#9da1a6" }} />
          <span className="text-[13px] font-medium text-white">Microphone</span>
        </div>
        {(micStatus === "idle" || micStatus === "requesting") && (
          <span className="text-[11px]" style={{ color: "#6e7681" }}>
            Requesting...
          </span>
        )}
        {micStatus === "pass" && (
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
        {micStatus === "fail" && (
          <span className="text-[11px]" style={{ color: "#f48771" }}>
            ✕ Denied
          </span>
        )}
      </div>

      {/* Body — pass: visualizer */}
      {micStatus === "pass" && (
        <div className="px-4 py-5">
          {/* Circular mic indicator */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            {audioLevel > 20 && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ border: "2px solid rgba(78,201,176,0.40)" }}
              />
            )}
            {audioLevel <= 20 && (
              <span
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid rgba(255,255,255,0.10)" }}
              />
            )}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200"
              style={
                audioLevel > 20
                  ? {
                      background: "rgba(78,201,176,0.10)",
                      border: "1px solid rgba(78,201,176,0.30)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }
              }
            >
              <Mic
                style={{
                  width: "24px",
                  height: "24px",
                  color: audioLevel > 20 ? "#4ec9b0" : "#6e7681",
                  transition: "color 200ms ease",
                }}
              />
            </div>
          </div>

          {/* Waveform bars */}
          <div
            className="flex items-end justify-center gap-[3px] mb-3"
            style={{ height: "40px" }}
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const barHeight =
                audioLevel > 0
                  ? Math.max(
                      4,
                      (audioLevel / 100) *
                        40 *
                        (0.4 + Math.sin((i / 15) * Math.PI) * 0.6)
                    )
                  : 4;
              return (
                <div
                  key={i}
                  style={{
                    width: "4px",
                    borderRadius: "9999px",
                    transition: "height 75ms ease",
                    height: `${barHeight}px`,
                    background:
                      audioLevel > 20
                        ? "linear-gradient(to top, #4ec9b0, rgba(78,201,176,0.40))"
                        : "rgba(255,255,255,0.10)",
                  }}
                />
              );
            })}
          </div>

          {/* Status text */}
          <p
            className="text-center text-[12px] transition-colors duration-200"
            style={{
              color:
                audioLevel > 30
                  ? "#4ec9b0"
                  : audioLevel > 5
                  ? "#6e7681"
                  : "rgba(110,118,129,0.5)",
            }}
          >
            {audioLevel > 30
              ? "🎤 Speaking detected"
              : audioLevel > 5
              ? "Listening..."
              : "Speak to test your microphone"}
          </p>
        </div>
      )}

      {/* Body — fail */}
      {micStatus === "fail" && (
        <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
          <MicOff
            style={{
              width: "32px",
              height: "32px",
              color: "rgba(110,118,129,0.30)",
            }}
          />
          <span className="text-[13px]" style={{ color: "#6e7681" }}>
            Microphone access denied
          </span>
          <button
            onClick={requestMic}
            className="px-4 py-2 rounded-lg text-[12px] transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#9da1a6",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
          >
            Allow Microphone Access
          </button>
        </div>
      )}

      {/* Body — idle / requesting */}
      {(micStatus === "idle" || micStatus === "requesting") && (
        <div className="px-4 py-8 flex items-center justify-center">
          <Loader
            className="animate-spin"
            style={{
              width: "20px",
              height: "20px",
              color: "rgba(110,118,129,0.40)",
            }}
          />
        </div>
      )}
    </div>
  );
}
