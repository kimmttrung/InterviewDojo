import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questionService } from '../services/question.service';
import {
  ChevronLeft,
  Star,
  PlusCircle,
  Share,
  MessageCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  Lightbulb,
  KeyRound,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Layout } from '../../../../shared/components/layout/Layout';
import { Button } from '../../../../shared/components/ui/button';
import { Badge } from '../../../../shared/components/ui/badge';
import CodeEditor from '../../code-editor/pages/CodeEditor';
import { Card } from '../../../../shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../shared/components/ui/avatar';
import { Input } from '../../../../shared/components/ui/input';

// --- MOCK DATA (Dùng tạm cho phần chưa có API) ---
const MOCK_ANSWERS = [
  {
    id: 1,
    user: {
      name: 'Kartikeya N.',
      role: 'Member',
      avatar: 'https://i.pravatar.cc/150?u=kartikeya',
      rating: '4.7k',
    },
    date: 'November 30, 2025',
    content:
      "Clarifying questions\n\n- What does improve mean? What aspect are we targeting? : User engagement with recommended videos\n- Are we looking at a specific platform (Mobile, Web, TV)? : Let's assume across all platforms.",
  },
];

export default function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myAnswer, setMyAnswer] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await questionService.getById(id as string);
        const data = res?.data?.data || res?.data;
        setQuestion(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetch();
  }, [id]);

  // ================= LOADING =================
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-500 font-medium">Loading question details...</p>
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-slate-800">Question not found</h2>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/question-bank">Go back to Question Bank</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // ================= 🎯 CODING UI (GIỮ NGUYÊN) =================
  if (question.isCodingQuestion) {
    return (
      <div className="h-screen flex overflow-hidden bg-white">
        {/* LEFT */}
        <div className="w-1/2 overflow-y-auto p-6 border-r">
          <Link to="/question-bank" className="text-sm text-indigo-600 flex items-center mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Link>

          <h1 className="text-2xl font-bold mb-3">{question.title}</h1>

          <div className="flex gap-2 mb-4">
            <Badge>{question.difficulty}</Badge>
            {question.tags?.map((t: string) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>

          {/* DESCRIPTION */}
          <div className="mb-6 whitespace-pre-line text-slate-700">{question.description}</div>

          {/* CONSTRAINTS */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Constraints</h3>
            <pre className="bg-slate-100 p-3 rounded text-sm whitespace-pre-wrap">
              {question.constraints}
            </pre>
          </div>

          {/* HINTS */}
          {question.hints?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Hints</h3>
              <ul className="list-disc ml-5 text-sm">
                {question.hints.map((h: string, i: number) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TEST CASE */}
          <div>
            <h3 className="font-semibold mb-3">Sample Test Cases</h3>
            {question.testCases
              ?.filter((tc: any) => tc.isSample)
              .map((tc: any) => (
                <div key={tc.id} className="mb-4 bg-slate-50 p-3 rounded border">
                  <div>
                    <b>Input:</b>
                    <pre>{tc.input}</pre>
                  </div>
                  <div>
                    <b>Output:</b>
                    <pre>{tc.expectedOutput}</pre>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-1/2 h-full">
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

  // ================= 🧠 NORMAL UI (CẬP NHẬT GIAO DIỆN MỚI) =================

  const companyName = question.companies?.[0] || 'Unknown';
  const companyInitial = companyName !== 'Unknown' ? companyName[0].toUpperCase() : '?';

  const formattedDate = question.createdAt
    ? new Date(question.createdAt).toLocaleDateString()
    : 'Unknown time';

  let parsedData: any = null;

  if (question?.data) {
    try {
      parsedData = typeof question.data === 'string' ? JSON.parse(question.data) : question.data;
    } catch (error) {
      console.error('Lỗi parse question.data:', error);
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 bg-white min-h-screen">
        {/* BREADCRUMB */}
        <div className="mb-6">
          <Link
            to="/question-bank"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            All Questions
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {question.title}
              </h1>

              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center font-bold text-indigo-600 text-[10px]">
                  {companyInitial}
                </div>
                <span>
                  Asked at <span className="text-slate-900">{companyName}</span> • {formattedDate}
                </span>

                {/* Render thêm tags nếu có */}
                <div className="ml-2 flex gap-2">
                  {question.difficulty && <Badge variant="outline">{question.difficulty}</Badge>}
                  {question.typeQuestion && (
                    <Badge variant="outline">{question.typeQuestion}</Badge>
                  )}
                </div>
              </div>

              {/* Mô tả chi tiết câu hỏi */}
              {parsedData ? (
                <div className="mt-6 flex flex-col gap-4">
                  {/* 1. Question */}
                  {parsedData.question && (
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 whitespace-pre-line leading-relaxed font-medium text-[15px]">
                      {parsedData.question}
                    </div>
                  )}

                  {/* 2. Key Points */}
                  {parsedData.keyPoints?.length > 0 && (
                    <div className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                      <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-3">
                        <KeyRound className="w-5 h-5 text-emerald-600" />
                        Key Points
                      </h4>
                      <ul className="space-y-2.5">
                        {parsedData.keyPoints.map((point: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm text-emerald-900/80"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Tips */}
                  {parsedData.tips?.length > 0 && (
                    <div className="p-5 bg-amber-50/40 border border-amber-100 rounded-xl">
                      <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-3">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Pro Tips
                      </h4>
                      <ul className="space-y-2.5">
                        {parsedData.tips.map((tip: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm text-amber-900/80"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. Follow-ups */}
                  {parsedData.followUps?.length > 0 && (
                    <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                      <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-3">
                        <HelpCircle className="w-5 h-5 text-indigo-600" />
                        Follow-up Questions
                      </h4>
                      <ul className="space-y-2.5">
                        {parsedData.followUps.map((q: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm text-indigo-900/80 font-medium"
                          >
                            <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 whitespace-pre-line leading-relaxed font-medium text-[15px]">
                  {question.description || 'No description available'}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <ActionButton icon={<Star className="w-4 h-4 mr-2" />} label="Save" />
                <ActionButton
                  icon={<PlusCircle className="w-4 h-4 mr-2" />}
                  label="I was asked this"
                />
                <Button
                  variant="ghost"
                  className="rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                >
                  <Share className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </div>

            {/* AI Practice Banner */}
            <Card className="p-6 border-indigo-100 bg-indigo-50/50 shadow-sm rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Practice this question with AI
                </h3>
                <p className="text-indigo-700/80 text-sm">
                  Try our new mock interview experience to get feedback instantly.
                </p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shrink-0 shadow-sm font-semibold px-6 py-5">
                Practice with AI
              </Button>
            </Card>

            {/* Answer Input Area */}
            <Card className="p-4 border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
              <Avatar className="h-10 w-10 border border-slate-200">
                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                  You
                </AvatarFallback>
              </Avatar>
              <Input
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="Add your own answer to this question..."
                className="bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-indigo-200 rounded-xl h-11"
              />
            </Card>

            {/* Answers List */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-slate-400" />
                  {question.answersCount || MOCK_ANSWERS.length} Answers
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-slate-200 text-slate-700 font-medium hover:border-indigo-300"
                >
                  🔥 Hot <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                </Button>
              </div>

              {/* Dùng Mock Answers */}
              {MOCK_ANSWERS.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <SidebarSection title="Interview Details">
                <DetailRow label="Difficulty" items={[question.difficulty || 'N/A']} />
                <DetailRow
                  label="Categories"
                  items={
                    question.categories?.length
                      ? question.categories
                      : [question.typeQuestion || 'N/A']
                  }
                />
                <DetailRow
                  label="Companies"
                  items={question.companies?.length ? question.companies : ['N/A']}
                />
              </SidebarSection>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ================= SUB COMPONENTS =================

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Button
      variant="outline"
      className="rounded-xl border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all h-10 px-4"
    >
      {icon} {label}
    </Button>
  );
}

function AnswerCard({ answer }: { answer: any }) {
  return (
    <div className="flex gap-4 p-4 -mx-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <Avatar className="h-10 w-10 border border-slate-200 shadow-sm shrink-0">
        <AvatarImage src={answer.user.avatar} />
        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
          {answer.user.name[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{answer.user.name}</span>
            <Badge
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[10px] rounded-md px-2 py-0.5"
            >
              {answer.user.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs font-medium text-slate-400">{answer.date}</div>

        <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {answer.content}
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-lg text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-start gap-2 py-1">
      <span className="text-sm font-semibold text-slate-400 mt-1">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map(
          (item, index) =>
            item && (
              <Badge
                key={index}
                variant="outline"
                className="font-medium text-slate-600 border-slate-200 bg-white rounded-lg"
              >
                {item}
              </Badge>
            ),
        )}
      </div>
    </div>
  );
}
