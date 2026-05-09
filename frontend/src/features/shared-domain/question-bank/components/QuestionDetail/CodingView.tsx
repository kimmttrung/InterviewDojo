import { Link } from 'react-router-dom';
import { ChevronLeft, Info, Lightbulb, Beaker } from 'lucide-react';
import CodeEditor from '../../../code-editor/pages/CodeEditor';
import { Badge } from '../../../../../shared/components/ui/badge';

export function CodingView({ question }: { question: any }) {
  return (
    <div className="h-screen flex overflow-hidden bg-white w-full">
      {/* LEFT: Question Details */}
      <div className="w-1/2 overflow-y-auto p-8 border-r bg-white custom-scrollbar">
        {/* Navigation */}
        <Link
          to="/question-bank"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Question Bank
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {question.title}
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-3 py-1">
              {question.difficulty}
            </Badge>
            {question.tags?.map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-slate-500 border-slate-200 font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="text-slate-700 leading-relaxed whitespace-pre-line text-[15px]">
            {question.description}
          </div>
        </div>

        {/* Constraints */}
        {question.constraints && (
          <div className="mb-8">
            <h3 className="flex items-center text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
              <Info className="w-4 h-4 mr-2 text-indigo-500" /> Constraints
            </h3>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <pre className="text-slate-600 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {question.constraints}
              </pre>
            </div>
          </div>
        )}

        {/* Hints */}
        {question.hints?.length > 0 && (
          <div className="mb-8">
            <h3 className="flex items-center text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Hints
            </h3>
            <div className="space-y-3">
              {question.hints.map((hint: string, index: number) => (
                <div key={index} className="flex gap-3 text-sm text-slate-600 items-start">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <p className="leading-relaxed">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Test Cases */}
        <div className="mb-10">
          <h3 className="flex items-center text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
            <Beaker className="w-4 h-4 mr-2 text-emerald-500" /> Sample Test Cases
          </h3>
          <div className="space-y-4">
            {question.testCases
              ?.filter((tc: any) => tc.isSample)
              .map((tc: any, index: number) => (
                <div
                  key={tc.id || index}
                  className="overflow-hidden border border-slate-100 rounded-xl"
                >
                  <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                    Case {index + 1}
                  </div>
                  <div className="p-4 space-y-3 font-mono text-sm">
                    <div>
                      <p className="text-slate-400 text-[11px] mb-1 font-sans font-bold uppercase tracking-tighter">
                        Input
                      </p>
                      <pre className="bg-slate-100/50 p-2 rounded text-slate-700">{tc.input}</pre>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] mb-1 font-sans font-bold uppercase tracking-tighter">
                        Output
                      </p>
                      <pre className="bg-slate-100/50 p-2 rounded text-slate-900 font-bold">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Code Editor */}
      <div className="w-1/2 h-full relative">
        <CodeEditor
          mode="solo"
          roomId={`question_${question.id}`}
          userId={'user_1'}
          currentQuestion={question}
        />
      </div>
    </div>
  );
}
