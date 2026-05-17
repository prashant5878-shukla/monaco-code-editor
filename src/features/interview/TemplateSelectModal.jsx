import { useState } from 'react';
import { TEMPLATES } from '../../lib/templates';
import { Icons } from '../../lib/icons';

const TEMPLATE_META = {
    'react-vite': { emoji: '⚛️', tag: 'Frontend' },
    'node-express': { emoji: '🟢', tag: 'Backend' },
    'fullstack': { emoji: '🚀', tag: 'Full-stack' },
};

export function TemplateSelectModal({ onStart }) {
    const [selected, setSelected] = useState(null);

    return (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
            {/* Subtle ambient glow spots */}
            <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-accent/4 rounded-full blur-[80px]" />

            <div className="relative w-full max-w-[540px] px-6 z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20
                                    flex items-center justify-center mx-auto mb-4">
                        <Icons.Code2 className="w-7 h-7 text-accent" />
                    </div>
                    <h1 className="text-xl font-bold text-primary mb-2 tracking-tight">
                        Select a template to begin
                    </h1>
                    <p className="text-sm text-secondary">
                        The timer starts when you click Start. You have 45 minutes.
                    </p>
                </div>

                {/* Template cards */}
                <div className="flex flex-col gap-3 mb-8">
                    {Object.entries(TEMPLATES).map(([key, tpl]) => {
                        const meta = TEMPLATE_META[key] ?? { emoji: '📁', tag: 'Project' };
                        const isSelected = selected === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setSelected(key)}
                                style={isSelected ? { boxShadow: '0 0 0 1px var(--color-accent), 0 4px 20px rgba(0,0,0,0.25)' } : {}}
                                className={`flex items-center gap-4 px-5 py-4 rounded-xl text-left
                                            cursor-pointer transition-all duration-200 bg-transparent
                                            ${isSelected
                                        ? 'border-2 border-accent bg-accent/8 scale-[1.01]'
                                        : 'border border-border-subtle hover:border-border-default hover:bg-hover hover:scale-[1.005]'
                                    }`}
                            >
                                {/* Emoji in a rounded square container */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
                                                 flex-shrink-0 transition-all
                                                 ${isSelected
                                        ? 'bg-accent/15 border border-accent/25'
                                        : 'bg-hover border border-border-subtle'}`}
                                >
                                    {meta.emoji}
                                </div>

                                {/* Labels */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-primary">{tpl.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border transition-colors
                                            ${isSelected
                                                ? 'bg-accent/10 text-accent border-accent/20'
                                                : 'bg-hover text-muted border-border-subtle'}`}
                                        >
                                            {meta.tag}
                                        </span>
                                    </div>
                                    <span className="text-xs text-secondary leading-relaxed">{tpl.description}</span>
                                </div>

                                {/* Selected check */}
                                {isSelected && (
                                    <Icons.Check className="w-4 h-4 text-accent flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Start button — premium gradient CTA */}
                <button
                    onClick={() => selected && onStart(selected)}
                    disabled={!selected}
                    className="w-full py-3.5 text-sm font-bold text-white rounded-xl
                               border-none cursor-pointer transition-all duration-200
                               bg-gradient-to-r from-accent to-accent/80
                               shadow-lg shadow-accent/20
                               hover:shadow-accent/40 hover:brightness-110
                               active:scale-[0.99]
                               disabled:opacity-40 disabled:cursor-not-allowed
                               disabled:shadow-none disabled:brightness-100"
                >
                    Start Interview
                </button>

                <p className="text-center text-[11px] text-muted mt-3">
                    Timer starts immediately on click
                </p>
            </div>
        </div>
    );
}