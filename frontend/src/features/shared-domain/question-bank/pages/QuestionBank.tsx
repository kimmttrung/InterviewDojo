import { useState, useEffect } from 'react';
import { questionService } from '../services/question.service';
import { Card } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Badge } from '../../../../shared/components/ui/badge';
import { Input } from '../../../../shared/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../shared/components/ui/dropdown-menu';
import {
  ChevronDown,
  Search,
  Bookmark,
  MessageCircle,
  PlusCircle,
  Code,
  Brain,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import { useDebounce } from '../../../../hooks/use-debounce';
import { Layout } from '../../../../shared/components/layout/Layout';

// --- TYPES ---
interface Question {
  id: number;
  title: string;
  createdAt?: string;
  difficulty?: string;
  typeQuestion?: string;
  answersCount?: number;
  description?: any;
  categories?: string[];
  companies?: string[];
  slug?: string;
  source: 'CODING' | 'NORMAL';
}

interface PaginationMeta {
  total: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export default function QuestionBank() {
  // --- STATES ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [typeQuestion, setTypeQuestion] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();

  const debouncedKeyword = useDebounce(keyword, 500);

  // --- FETCH DATA ---
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 10,
        keyword: debouncedKeyword, // Dùng cái đã debounce để tránh gọi API liên tục
        difficulty: difficulty,
        typeQuestion: typeQuestion || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        source: source,
      };
      const res = await questionService.getAll(params);

      // Kiểm tra log: nếu res.data chứa { statusCode, data, meta }
      // Thì mảng thực sự nằm ở res.data.data
      const actualQuestions = res?.data?.data || [];
      const actualMeta = res?.data?.meta || null;

      setQuestions(actualQuestions);
      setMeta(actualMeta);
    } catch (error) {
      console.error('Failed to fetch:', error);
      setQuestions([]); // Đảm bảo luôn là mảng khi lỗi
    } finally {
      setLoading(false);
    }
  };

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, difficulty, typeQuestion]);

  // Fetch data
  useEffect(() => {
    fetchQuestions();
  }, [page, debouncedKeyword, difficulty, typeQuestion]);

  console.log('questions:', questions);
  console.log('meta:', meta);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 bg-white min-h-screen">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Interview Questions
            </h1>
            <p className="text-slate-500 text-lg">Review {meta?.total || 0} verified questions.</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">+ Share interview</Button>
        </div>

        {/* FILTER BAR */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            {/* Difficulty */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg">
                  {difficulty || 'Difficulty'} <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                <DropdownMenuItem onClick={() => setDifficulty(undefined)}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficulty('EASY')}>Easy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficulty('MEDIUM')}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDifficulty('HARD')}>Hard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg border-indigo-600 text-indigo-600">
                  {source === 'CODING' ? 'CODING' : typeQuestion || 'Category'}
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white w-56">
                <DropdownMenuItem
                  onClick={() => {
                    setTypeQuestion(undefined);
                    setSource(undefined);
                  }}
                >
                  All Categories
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTypeQuestion(undefined);
                    setSource('CODING');
                  }}
                >
                  <Code className="w-4 h-4 mr-2 text-blue-500" /> Coding
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTypeQuestion('SYSTEM_DESIGN');
                    setSource('NORMAL');
                  }}
                >
                  <Brain className="w-4 h-4 mr-2 text-pink-500" /> System Design
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTypeQuestion('BEHAVIORAL');
                    setSource('NORMAL');
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-purple-500" /> Behavioral
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTypeQuestion('TECHNICAL');
                    setSource('NORMAL');
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> Technical
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 mt-4">Loading questions...</p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      id={q.id} // Bổ sung truyền id
                      title={q.title}
                      askedAt={q.companies?.[0] || 'Unknown'} // Có thể lấy công ty đầu tiên nếu có
                      timeAgo={q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Unknown'}
                      tags={[q.typeQuestion, q.difficulty].filter(Boolean)}
                      answers={q.answersCount || 0}
                      hasVideo={false}
                      codeSnippet={q.description || ''}
                      slug={q.slug}
                    />
                  ))}
                </div>

                {/* PAGINATION */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-10 pb-20">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={page === p ? 'default' : 'ghost'}
                        onClick={() => setPage(p)}
                        className={page === p ? 'bg-indigo-600' : ''}
                      >
                        {p}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search for questions..."
                  className="pl-10 h-12 bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// --- SUB COMPONENTS (GIỮ NGUYÊN STYLE ĐẸP) ---

function FilterDropdown({ label }: { label: string }) {
  return (
    <Button
      variant="outline"
      className="rounded-lg border-slate-200 text-slate-700 font-medium hover:border-indigo-300"
    >
      {label} <ChevronDown className="ml-2 w-4 h-4 text-slate-400" />
    </Button>
  );
}

function FeaturedSmallCard({
  title,
  icon,
  bgColor,
}: {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4 min-w-[320px] rounded-2xl border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all group">
      <div
        className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700 leading-tight">{title}</span>
    </Card>
  );
}

function QuestionCard({
  id,
  askedAt,
  timeAgo,
  title,
  tags,
  answers,
  hasVideo,
  codeSnippet,
  slug,
}: any) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/questions/${id}/${slug}`)}
      className="p-6 border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all rounded-2xl group cursor-pointer relative overflow-hidden"
    >
      <div className="flex justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <span className="text-indigo-600 text-lg">∞</span>
            <span>
              Asked at <span className="text-slate-900">{askedAt}</span>
            </span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
            {title}
          </h2>

          <div className="flex flex-wrap gap-2">
            {tags.map((t: string) => (
              <Badge
                key={t}
                variant="outline"
                className="text-slate-500 rounded-md border-slate-200 font-medium bg-white"
              >
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-2">
            <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              <Bookmark className="w-4 h-4" /> Save
            </button>
            <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              <MessageCircle className="w-4 h-4" /> {answers} answers
            </button>
            <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              <PlusCircle className="w-4 h-4" /> I was asked this
            </button>
          </div>
        </div>

        {hasVideo && (
          <div className="relative w-44 h-28 rounded-2xl overflow-hidden shadow-lg shrink-0 group/video">
            <img
              src={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80`}
              className="w-full h-full object-cover transition-transform group-hover/video:scale-110"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <PlayCircle className="w-8 h-8 text-white fill-indigo-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ANSWER SNIPPET BOX */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
        <div className="flex -space-x-2 shrink-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm"
            >
              <img src={`https://i.pravatar.cc/150?u=${i + askedAt}`} />
            </div>
          ))}
        </div>
        <p className="text-[13px] text-slate-500 font-mono line-clamp-1 italic flex-1 truncate">
          "
          {typeof codeSnippet === 'string'
            ? codeSnippet
            : codeSnippet?.question || 'No description available'}
          "
        </p>
        <ChevronDown className="w-4 h-4 text-slate-300" />
      </div>
    </Card>
  );
}

function CompanyRow({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-indigo-600 text-sm border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
          {logo}
        </div>
        <span className="text-sm font-bold text-slate-700">{name}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
    </div>
  );
}
