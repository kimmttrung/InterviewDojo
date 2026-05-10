// src/shared-domain/question-bank/components/QuestionDetail/CodingDescription.tsx
import { Info, Lightbulb, Beaker } from 'lucide-react';
import { Badge } from '../../../../../shared/components/ui/badge';

export function CodingDescription({ question }: { question: any }) {
  const details = question.codingQuestion || question; // Phụ thuộc vào cách map data của bạn

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Title & Tags */}
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{question.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-slate-100 text-slate-700 border-none">{question.difficulty}</Badge>
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
      <div className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
        {question.description || details.description}
      </div>

      {/* Constraints */}
      {details.constraints && (
        <div className="space-y-2">
          <h3 className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Info className="w-3 h-3 mr-1 text-indigo-500" /> Constraints
          </h3>
          <pre className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs font-mono text-slate-600 whitespace-pre-wrap">
            {details.constraints}
          </pre>
        </div>
      )}

      {/* Hints */}
      {details.hints?.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Lightbulb className="w-3 h-3 mr-1 text-amber-500" /> Hints
          </h3>
          <div className="space-y-2">
            {details.hints.map((hint: string, i: number) => (
              <p key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="text-amber-500 font-bold">{i + 1}.</span> {hint}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sample Test Cases (Dạng rút gọn cho Sidebar) */}
      {question.testCases?.filter((tc: any) => tc.isSample).length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Beaker className="w-3 h-3 mr-1 text-emerald-500" /> Examples
          </h3>
          {question.testCases
            .filter((tc: any) => tc.isSample)
            .map((tc: any, i: number) => (
              <div
                key={i}
                className="border border-slate-100 rounded-lg overflow-hidden text-[11px]"
              >
                <div className="bg-slate-50 px-2 py-1 border-b border-slate-100 font-bold text-slate-400">
                  Case {i + 1}
                </div>
                <div className="p-2 font-mono">
                  <div className="text-blue-600">In: {tc.input}</div>
                  <div className="text-emerald-600">Out: {tc.expectedOutput}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
