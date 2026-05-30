// features/questions/components/QuestionDetail/AnswerSection.tsx
import { PlusCircle, Share, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface AnswerSectionProps {
  question?: {
    id: number;
    title: string;
    type?: string;
    data?: any;
    description?: string;
  };
}

export function AnswerSection({ question }: AnswerSectionProps) {
  const navigate = useNavigate();

  const handleTryWithAI = () => {
    navigate('/practice/solo-recording', {
      state: {
        preselectedQuestion: {
          id: question?.id,
          title: question?.title,
          data: question?.data,
          description: question?.description,
          type: question?.type,
        },
      },
    });
  };

  return (
    <div className="space-y-6 mt-10 border-t border-slate-100 pt-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-all"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> I was asked this
        </Button>
        <Button variant="ghost" className="rounded-xl text-slate-500">
          <Share className="w-4 h-4 mr-2" /> Share
        </Button>
      </div>

      {/* AI Suggestion Banner */}
      <Card className="p-6 border-indigo-100 bg-indigo-50/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />

          <p className="text-indigo-800 text-sm font-medium leading-relaxed">
            <b>Tip:</b> You can use AI to grade your answers instantly.
          </p>
        </div>
        <Button
          onClick={handleTryWithAI}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-4 h-9 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Try now
        </Button>
      </Card>
    </div>
  );
}
