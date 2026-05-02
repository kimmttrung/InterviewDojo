import { useState } from 'react';
import { Question } from '../../../shared/types/interview';

interface QuestionPanelProps {
  question: Question | null;
  mode: 'code' | 'theory';
  onRandom: (type: 'code' | 'theory') => void;
  isLoading: boolean;
}

const diffColor: Record<string, string> = {
  Easy: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Hard: 'text-red-600 bg-red-50 border-red-200',
};

export function QuestionPanel({ question, mode, onRandom, isLoading }: QuestionPanelProps) {
  const [showHints, setShowHints] = useState(false);

  return (
    <aside className="w-[22%] min-w-[280px] border-r border-slate-200 bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b bg-slate-50">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onRandom('code')}
            className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
              mode === 'code'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-transparent bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            💻 Coding
          </button>
          <button
            onClick={() => onRandom('theory')}
            className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
              mode === 'theory'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-transparent bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            🧠 Theory
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {question ? (
          <div className="space-y-4">
            {/* Header với title và difficulty */}
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-sm font-black text-slate-800 leading-tight">{question.title}</h3>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${diffColor[question.difficulty]}`}
              >
                {question.difficulty}
              </span>
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {question.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[8px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
              {question.content}
            </div>

            {/* Constraints */}
            {question.constraints && mode === 'code' && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ⚠️ Constraints:
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {question.constraints}
                </div>
              </div>
            )}

            {/* Examples */}
            {question.examples.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  📝 Examples:
                </p>
                {question.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 rounded-lg p-2 text-[10px] font-mono text-white space-y-1"
                  >
                    <div className="text-emerald-400">Input: {ex.input}</div>
                    <div className="text-blue-400">Output: {ex.output}</div>
                    {ex.explanation && (
                      <div className="text-slate-400 text-[9px] border-t border-slate-700 mt-1 pt-1">
                        💡 {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Hints */}
            {question.hints && question.hints.length > 0 && mode === 'code' && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  💡 {showHints ? 'Hide' : 'Show'} Hints
                </button>
                {showHints && (
                  <div className="space-y-1">
                    {question.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] text-slate-600 bg-blue-50 p-2 rounded-lg border border-blue-200"
                      >
                        {idx + 1}. {hint}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Time & Memory Limits */}
            {question.timeLimit && question.memoryLimit && mode === 'code' && (
              <div className="flex gap-3 text-[9px] text-slate-500 border-t border-slate-100 pt-3">
                <span>⏱️ Time: {question.timeLimit}ms</span>
                <span>💾 Memory: {question.memoryLimit}KB</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
            <span className="text-3xl">🎯</span>
            <p className="text-center text-[11px] font-medium">
              Chọn loại câu hỏi và nhấn Random để bắt đầu
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <button
          onClick={() => onRandom(mode)}
          disabled={isLoading}
          className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
              Loading...
            </span>
          ) : (
            '🔀 Random Question'
          )}
        </button>
      </div>
    </aside>
  );
}
