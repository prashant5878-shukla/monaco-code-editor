import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Video, VideoOff, Loader } from 'lucide-react';
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

export function CameraCard({ startCheck }) {
  const dispatch = useDispatch();
  const cameraStatus = useSelector((s) => s.start.checks.camera);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const requestCamera = useCallback(async () => {
    // Stop any existing stream first
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    dispatch(setCheckStatus({ key: "camera", status: "requesting" }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      dispatch(setCheckStatus({ key: "camera", status: "pass" }));
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraStream(null);
      dispatch(setCheckStatus({ key: "camera", status: "fail" }));
    }
  }, [cameraStream, dispatch]);

  // Request on startCheck trigger
  useEffect(() => {
    if (startCheck && cameraStatus === "idle") {
      requestCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCheck]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Cleanup tracks on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <MediaCardHeader
        Icon={Video}
        label="Camera"
        status={cameraStatus}
      />

      {/* Preview area */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16/9", background: "#0a0a0f" }}
      >
        {cameraStatus === "pass" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
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
              Camera is active — interviewer can see you
            </div>
          </>
        )}

        {cameraStatus === "fail" && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <VideoOff
              style={{
                width: "40px",
                height: "40px",
                color: "rgba(110,118,129,0.3)",
              }}
            />
            <span
              className="text-[13px]"
              style={{ color: "#6e7681" }}
            >
              Camera access denied
            </span>
            <button
              onClick={requestCamera}
              className="px-4 py-2 rounded-lg text-[12px] transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#9da1a6",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(255,255,255,0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(255,255,255,0.06)";
              }}
            >
              Allow Camera Access
            </button>
          </div>
        )}

        {(cameraStatus === "idle" ||
          cameraStatus === "requesting") && (
          <div className="w-full h-full flex items-center justify-center">
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
      </div>
    </div>
  );
}
