import { Question } from '../../../shared/types/interview';

interface QuestionDetailProps {
  question: Question;
  mode: 'code' | 'theory';
}

export function QuestionDetail({ question, mode }: QuestionDetailProps) {
  const diffColor: Record<string, string> = {
    Easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Hard: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold text-slate-900">{question.title}</h1>
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold border ${diffColor[question.difficulty]}`}
            >
              {question.difficulty}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag, idx) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: question.content }} />
        </div>

        {/* Examples */}
        {question.examples.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Examples</h3>
            <div className="space-y-3">
              {question.examples.map((ex, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-4 border">
                  <div className="font-mono text-sm">
                    <div className="mb-2">
                      <span className="font-semibold text-slate-700">Input:</span>
                      <pre className="mt-1 bg-white p-2 rounded border">{ex.input}</pre>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Output:</span>
                      <pre className="mt-1 bg-white p-2 rounded border">{ex.output}</pre>
                    </div>
                    {ex.explanation && (
                      <div className="mt-2 text-slate-600 text-sm">
                        💡 Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {question.constraints && mode === 'code' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Constraints</h3>
            <pre className="bg-slate-50 p-3 rounded-lg border text-sm font-mono">
              {question.constraints}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
