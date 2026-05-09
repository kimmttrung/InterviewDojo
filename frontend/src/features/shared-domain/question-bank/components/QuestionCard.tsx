import { useNavigate } from 'react-router-dom';
import { Bookmark, MessageCircle, PlusCircle, ChevronDown } from 'lucide-react';
import { Question } from '../types';
import { Card } from '../../../../shared/components/ui/card';
import { Badge } from '../../../../shared/components/ui/badge';

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const navigate = useNavigate();
  const {
    id,
    title,
    slug,
    difficulty,
    questionType,
    createdAt,
    answersCount,
    description,
    companies,
  } = question;

  // Xử lý nội dung mô tả hiển thị tóm tắt (snippet)
  const renderSnippet = () => {
    if (typeof description === 'string') return description;
    if (description?.question) return description.question;
    return 'No description available';
  };

  const timeAgo = createdAt ? new Date(createdAt).toLocaleDateString() : 'Recent';

  return (
    <Card
      onClick={() => navigate(`/questions/${id}/${slug}`)}
      className="p-6 border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all rounded-2xl group cursor-pointer relative overflow-hidden bg-white"
    >
      <div className="flex justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <span className="text-indigo-600 text-lg">∞</span>
            <span>
              Asked at <span className="text-slate-900">{companies?.[0] || 'Top Tech'}</span>
            </span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
            {title}
          </h2>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-indigo-600 bg-indigo-50/50 border-indigo-100">
              {questionType}
            </Badge>
            <Badge
              variant="outline"
              className={`font-medium ${
                difficulty === 'HARD'
                  ? 'text-red-500'
                  : difficulty === 'MEDIUM'
                    ? 'text-amber-500'
                    : 'text-emerald-500'
              }`}
            >
              {difficulty}
            </Badge>
          </div>

          <div className="flex items-center gap-6 pt-2 text-slate-400">
            <button className="flex items-center gap-1.5 text-sm font-bold hover:text-indigo-600 transition-colors">
              <Bookmark className="w-4 h-4" /> Save
            </button>
            <button className="flex items-center gap-1.5 text-sm font-bold hover:text-indigo-600 transition-colors">
              <MessageCircle className="w-4 h-4" /> {answersCount || 0} answers
            </button>
            <button className="flex items-center gap-1.5 text-sm font-bold hover:text-indigo-600 transition-colors">
              <PlusCircle className="w-4 h-4" /> I was asked this
            </button>
          </div>
        </div>
      </div>

      {/* Answer Snippet Box (Giống giao diện mẫu bạn gửi) */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
        <p className="text-[13px] text-slate-500 font-mono line-clamp-1 italic flex-1 truncate">
          "{renderSnippet()}"
        </p>
        <ChevronDown className="w-4 h-4 text-slate-300" />
      </div>
    </Card>
  );
}
