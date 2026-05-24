import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle,
  ChevronDown,
  Upload,
  FileText,
  X as XIcon,
} from 'lucide-react';
import { updateForm } from '../../store/startSlice';

// ── Dropdown option lists ─────────────────────────────────────────────────────
const EXPERIENCE_OPTIONS = [
  "",
  "< 1 year",
  "1–2 years",
  "2–4 years",
  "4–6 years",
  "6–10 years",
  "10+ years",
];

const NOTICE_OPTIONS = [
  "",
  "Immediate",
  "15 days",
  "30 days",
  "45 days",
  "60 days",
  "90 days",
  "Currently serving notice",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Shared input style helpers ────────────────────────────────────────────────
const INPUT_BASE = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#e6edf3",
  fontFamily: "inherit",
  outline: "none",
};

function applyFocus(el) {
  el.style.borderColor = "rgba(59,130,246,0.6)";
  el.style.background = "rgba(255,255,255,0.06)";
}
function applyBlur(el) {
  el.style.borderColor = "rgba(255,255,255,0.08)";
  el.style.background = "rgba(255,255,255,0.04)";
}

// ── Local sub-components ──────────────────────────────────────────────────────
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

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] uppercase mb-1.5"
      style={{ color: "#6e7681", letterSpacing: "0.08em" }}
    >
      {children}
      {required && (
        <span style={{ color: "#3b82f6" }} className="ml-0.5">
          *
        </span>
      )}
    </label>
  );
}

function TextInput({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  rightEl,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full h-10 rounded-xl px-3.5 text-[13px] outline-none transition-all"
        style={{ ...INPUT_BASE, paddingRight: rightEl ? "2.5rem" : undefined }}
        onFocus={(e) => applyFocus(e.target)}
        onBlur={(e) => applyBlur(e.target)}
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {rightEl}
        </div>
      )}
    </div>
  );
}

function SelectInput({ id, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full h-10 rounded-xl px-3.5 text-[13px] outline-none transition-all appearance-none"
        style={{
          ...INPUT_BASE,
          background: "#0a0a0f",
          color: value ? "#e6edf3" : "#6e7681",
        }}
        onFocus={(e) => applyFocus(e.target)}
        onBlur={(e) => applyBlur(e.target)}
      >
        {options.map((opt, i) => (
          <option
            key={opt}
            value={opt}
            disabled={i === 0}
            style={{ background: "#111" }}
          >
            {i === 0 ? "Select…" : opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "#6e7681", width: "14px", height: "14px" }}
      />
    </div>
  );
}

export function CandidateForm({ resume, onResumeChange }) {
  const dispatch = useDispatch();
  const fileInput = useRef(null);
  const form = useSelector((s) => s.start.form);

  function update(field, value) {
    dispatch(updateForm({ field, value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      update("resumeFileName", file.name);
      update("resumeSize", file.size);
      onResumeChange(file);
    } else {
      update("resumeFileName", "");
      update("resumeSize", 0);
      onResumeChange(null);
    }
    // Reset so same file can be re-selected after removal
    e.target.value = "";
  }

  function removeFile() {
    update("resumeFileName", "");
    update("resumeSize", 0);
    onResumeChange(null);
  }

  return (
    <div className="mb-8">
      <StepHeader number="1" title="Your Information" />

      {/* Row 1: Full Name + Email */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <FieldLabel htmlFor="fullName" required>
            Full Name
          </FieldLabel>
          <TextInput
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="John Doe"
            autoComplete="name"
          />
        </div>
        <div>
          <FieldLabel htmlFor="email" required>
            Email Address
          </FieldLabel>
          <TextInput
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@example.com"
            autoComplete="email"
            rightEl={
              isValidEmail(form.email) ? (
                <CheckCircle
                  style={{
                    color: "#4ec9b0",
                    width: "14px",
                    height: "14px",
                  }}
                />
              ) : null
            }
          />
        </div>
      </div>

      {/* Row 2: Phone + Experience */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
          <TextInput
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
        </div>
        <div>
          <FieldLabel htmlFor="experience" required>
            Years of Experience
          </FieldLabel>
          <SelectInput
            id="experience"
            value={form.experience}
            onChange={(e) => update("experience", e.target.value)}
            options={EXPERIENCE_OPTIONS}
          />
        </div>
      </div>

      {/* Row 3: Notice Period + Current CTC */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <FieldLabel htmlFor="noticePeriod">Notice Period</FieldLabel>
          <SelectInput
            id="noticePeriod"
            value={form.noticePeriod}
            onChange={(e) => update("noticePeriod", e.target.value)}
            options={NOTICE_OPTIONS}
          />
        </div>
        <div>
          <FieldLabel htmlFor="currentCTC">Current CTC</FieldLabel>
          <TextInput
            id="currentCTC"
            value={form.currentCTC}
            onChange={(e) => update("currentCTC", e.target.value)}
            placeholder="e.g. 12 LPA or $80,000"
          />
        </div>
      </div>

      {/* Row 4: Expected CTC (full width) */}
      <div className="mb-3">
        <FieldLabel htmlFor="expectedCTC">Expected CTC</FieldLabel>
        <TextInput
          id="expectedCTC"
          value={form.expectedCTC}
          onChange={(e) => update("expectedCTC", e.target.value)}
          placeholder="e.g. 18 LPA or $110,000"
        />
      </div>

      {/* Row 5: Resume upload (full width) */}
      <div className="mb-3">
        <FieldLabel htmlFor="resume-upload" required>
          Resume / CV
        </FieldLabel>
        {/* Hidden file input */}
        <input
          ref={fileInput}
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div
          onClick={() => fileInput.current?.click()}
          className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all"
          style={{
            border: "2px dashed rgba(255,255,255,0.10)",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.40)";
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.10)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {resume ? (
            <>
              <FileText
                style={{
                  color: "#3b82f6",
                  width: "24px",
                  height: "24px",
                }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] text-white truncate max-w-[260px]"
                  title={resume.name}
                >
                  {resume.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="flex-shrink-0 p-0.5 rounded-full transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <XIcon
                    style={{
                      color: "#9da1a6",
                      width: "12px",
                      height: "12px",
                    }}
                  />
                </button>
              </div>
              <span
                className="text-[11px]"
                style={{ color: "#6e7681" }}
              >
                {formatBytes(resume.size)}
              </span>
            </>
          ) : (
            <>
              <Upload
                style={{
                  color: "#6e7681",
                  width: "24px",
                  height: "24px",
                }}
              />
              <span
                className="text-[13px]"
                style={{ color: "#9da1a6" }}
              >
                Upload Resume
              </span>
              <span
                className="text-[11px]"
                style={{ color: "#6e7681" }}
              >
                PDF or DOCX, max 5MB
              </span>
            </>
          )}
        </div>
      </div>

      {/* Future fields placeholder */}
      <div
        className="mt-4 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-[11px] italic" style={{ color: "#6e7681" }}>
          Additional fields may appear here based on role requirements.
        </p>
      </div>
    </div>
  );
}
