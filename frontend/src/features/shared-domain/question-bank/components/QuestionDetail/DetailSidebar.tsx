import { Badge } from '../../../../../shared/components/ui/badge';

interface DetailRowProps {
  label: string;
  items: string[];
}

function DetailRow({ label, items }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-start gap-2 py-1">
      <span className="text-sm font-semibold text-slate-400 mt-1">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map(
            (item, index) =>
              item && (
                <Badge
                  key={index}
                  variant="outline"
                  className="font-medium text-slate-600 border-slate-200 bg-white rounded-lg shadow-sm"
                >
                  {item}
                </Badge>
              ),
          )
        ) : (
          <span className="text-sm text-slate-300 italic">N/A</span>
        )}
      </div>
    </div>
  );
}

interface DetailSidebarProps {
  question: any;
}

export function DetailSidebar({ question }: DetailSidebarProps) {
  // Lấy danh sách companies từ question, nếu không có thì để mảng rỗng
  const companies = question.companies || [];

  // Lấy danh sách categories hoặc fallback về typeQuestion
  const categories = question.categories?.length
    ? question.categories
    : [question.type].filter(Boolean);

  return (
    <div className="sticky top-24 space-y-8">
      <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Interview Details</h3>

        <div className="space-y-4">
          <DetailRow label="Difficulty" items={[question.difficulty].filter(Boolean)} />

          <DetailRow label="Categories" items={categories} />

          <DetailRow label="Companies" items={companies} />
        </div>

        {/* Thông tin bổ sung nếu cần */}
        <div className="pt-4 border-t border-slate-200/60 mt-4">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Question ID</span>
            <span className="text-slate-600">#{question.id}</span>
          </div>
        </div>
      </div>

      {/* Widget gợi ý (Optional) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl shadow-indigo-200">
        <h4 className="font-bold mb-2 text-sm uppercase tracking-wider text-indigo-300">
          Career Tip
        </h4>
        <p className="text-xs leading-relaxed text-slate-300">
          When answering <b>{question.type}</b> questions, always start by clarifying requirements
          to show you think like a Senior Engineer.
        </p>
      </div>
    </div>
  );
}
