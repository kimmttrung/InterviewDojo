import { KeyRound, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Question } from '../../types';

interface TheoryViewProps {
  question: Question;
  parsedData: any;
}

export function TheoryView({ question, parsedData }: TheoryViewProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{question.title}</h1>
        {/* Render nội dung câu hỏi */}
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 whitespace-pre-line leading-relaxed font-medium text-[15px]">
          {parsedData?.question || question.description}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Key Points */}
        {parsedData?.keyPoints?.length > 0 && (
          <SectionBox
            icon={<KeyRound className="w-5 h-5 text-emerald-600" />}
            title="Key Points"
            colorClass="bg-emerald-50/40 border-emerald-100 text-emerald-800"
          >
            <ul className="space-y-2.5">
              {parsedData.keyPoints.map((point: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </SectionBox>
        )}

        {/* Pro Tips */}
        {parsedData?.tips?.length > 0 && (
          <SectionBox
            icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
            title="Pro Tips"
            colorClass="bg-amber-50/40 border-amber-100 text-amber-800"
          >
            <ul className="space-y-2.5 text-sm">
              {parsedData.tips.map((tip: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </SectionBox>
        )}
      </div>
    </div>
  );
}

function SectionBox({ icon, title, children, colorClass }: any) {
  return (
    <div className={`p-5 border rounded-xl ${colorClass}`}>
      <h4 className="flex items-center gap-2 font-bold mb-3">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
