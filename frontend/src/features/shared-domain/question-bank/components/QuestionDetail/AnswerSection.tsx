// features/questions/components/QuestionDetail/AnswerSection.tsx
import { PlusCircle, Share } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AnswerSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 mt-10">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
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
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0" />
          <p className="text-indigo-800 text-sm font-medium">
            <b>Tip:</b> You can use AI to grade your answers instantly.
          </p>
        </div>
        {/* Thêm onClick điều hướng ở đây */}
        <Button
          onClick={() => navigate('/practice/solo-recording')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-4 h-9"
        >
          Try now
        </Button>
      </Card>
    </div>
  );
}
