import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icons } from '../lib/icons';

const QUESTIONS = [
    {
        id: 1,
        text: 'Explain the overall architecture of your solution. Why did you structure it this way?',
    },
    {
        id: 2,
        text: 'What would you change or improve if you had more time?',
    },
];

// ── Audio recorder ────────────────────────────────────────────────────────────
function AudioRecorder({ onRecorded }) {
    const [status, setStatus] = useState('idle'); // idle | recording | done
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRef = useRef(null);
    const chunksRef = useRef([]);

    async function startRecording() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = e => chunksRef.current.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setStatus('done');
            onRecorded(blob);
            stream.getTracks().forEach(t => t.stop());
        };

        recorder.start();
        setStatus('recording');
    }

    function stopRecording() {
        mediaRef.current?.stop();
    }

    function reRecord() {
        setAudioUrl(null);
        setStatus('idle');
        onRecorded(null);
    }

    if (status === 'idle') {
        return (
            <button
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                   bg-danger/10 text-danger border border-danger/20 cursor-pointer
                   hover:bg-danger/20 transition-colors"
            >
                <span className="w-2 h-2 rounded-full bg-danger" />
                Start Recording
            </button>
        );
    }

    if (status === 'recording') {
        return (
            <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                   bg-danger text-white border-none cursor-pointer
                   hover:bg-danger/80 transition-colors animate-pulse"
            >
                <Icons.Square className="w-3.5 h-3.5" />
                Stop Recording
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <audio src={audioUrl} controls className="w-full h-9" />
            <button
                onClick={reRecord}
                className="text-xs text-muted hover:text-secondary transition-colors
                   bg-transparent border-none cursor-pointer text-left"
            >
                Re-record
            </button>
        </div>
    );
}

// ── Single question card ──────────────────────────────────────────────────────
function QuestionCard({ question, index, total, answer, onAnswer, onNext, isLast }) {
    const [mode, setMode] = useState('text'); // 'text' | 'audio'
    const canNext = mode === 'text'
        ? answer?.text?.trim()?.length > 10
        : answer?.audio != null;

    return (
        <div className="w-full max-w-[600px]">

            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-1 bg-border-subtle rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${((index) / total) * 100}%` }}
                    />
                </div>
                <span className="text-[11px] font-mono text-muted">{index}/{total}</span>
            </div>

            {/* Question */}
            <div className="mb-6">
                <span className="text-[11px] text-muted font-mono mb-2 block">
                    Question {index}
                </span>
                <p className="text-[16px] text-primary leading-relaxed font-medium">
                    {question.text}
                </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 mb-4 p-1 bg-sidebar border border-border-subtle rounded-lg w-fit">
                {['text', 'audio'].map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize
                        border-none cursor-pointer transition-colors
                        ${mode === m
                                ? 'bg-background text-primary'
                                : 'bg-transparent text-muted hover:text-secondary'
                            }`}
                    >
                        {m === 'text' ? '⌨️ Type' : '🎤 Record'}
                    </button>
                ))}
            </div>

            {/* Answer area */}
            {mode === 'text' ? (
                <div className="mb-6">
                    <textarea
                        value={answer?.text ?? ''}
                        onChange={e => onAnswer({ ...answer, text: e.target.value })}
                        placeholder="Type your answer here…"
                        rows={6}
                        className="w-full bg-sidebar border border-border-subtle rounded-lg
                       px-4 py-3 text-[13px] text-primary leading-relaxed
                       placeholder-muted outline-none resize-none font-sans
                       focus:border-accent transition-colors"
                    />
                    <span className="text-[11px] text-muted">
                        {answer?.text?.trim()?.length ?? 0} chars
                    </span>
                </div>
            ) : (
                <div className="mb-6">
                    <AudioRecorder onRecorded={blob => onAnswer({ ...answer, audio: blob })} />
                </div>
            )}

            {/* Next */}
            <button
                onClick={onNext}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium
                   text-white bg-accent rounded-lg border-none cursor-pointer
                   hover:bg-accent-hover transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {isLast ? 'Submit Answers' : 'Next Question'}
                <Icons.ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── VivaPage ──────────────────────────────────────────────────────────────────
export function VivaPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [done, setDone] = useState(false);

    const current = QUESTIONS[currentIdx];
    const isLast = currentIdx === QUESTIONS.length - 1;

    function handleNext() {
        if (isLast) {
            setDone(true);
            // TODO: send answers + location.state (session data) to backend for scoring
            console.log('Viva complete. Answers:', answers);
        } else {
            setCurrentIdx(i => i + 1);
        }
    }

    if (done) {
        return (
            <div className="h-screen w-screen bg-background flex flex-col items-center
                      justify-center gap-6 text-primary font-sans">
                <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20
                        flex items-center justify-center">
                    <Icons.Check className="w-8 h-8 text-success" />
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-semibold mb-2">All done!</h2>
                    <p className="text-sm text-secondary">
                        Your answers have been submitted. Results will be available shortly.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/editor')}
                    className="px-5 py-2 text-sm text-muted border border-border-subtle
                     rounded-lg hover:bg-hover hover:text-primary transition-colors
                     bg-transparent cursor-pointer"
                >
                    Back to editor
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-background flex flex-col font-sans">

            {/* Header */}
            <div className="flex items-center justify-between px-8 h-14 border-b
                      border-border-subtle flex-shrink-0 bg-sidebar">
                <div className="flex items-center gap-2">
                    <Icons.Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-primary">Viva</span>
                </div>
                <span className="text-xs text-muted">
                    {QUESTIONS.length} questions about your submission
                </span>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <QuestionCard
                    key={current.id}
                    question={current}
                    index={currentIdx + 1}
                    total={QUESTIONS.length}
                    answer={answers[current.id]}
                    onAnswer={ans => setAnswers(prev => ({ ...prev, [current.id]: ans }))}
                    onNext={handleNext}
                    isLast={isLast}
                />
            </div>
        </div>
    );
}