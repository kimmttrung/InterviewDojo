import { useState } from 'react';
import { MessageCircle, ChevronDown, MoreHorizontal, Star, PlusCircle, Share } from 'lucide-react';
import { Button } from '../../../../../shared/components/ui/button';
import { Card } from '../../../../../shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../shared/components/ui/avatar';
import { Input } from '../../../../../shared/components/ui/input';
import { Badge } from '../../../../../shared/components/ui/badge';

const MOCK_ANSWERS = [
  {
    id: 1,
    user: {
      name: 'Kartikeya N.',
      role: 'Member',
      avatar: 'https://i.pravatar.cc/150?u=kartikeya',
    },
    date: 'November 30, 2025',
    content:
      "Clarifying questions\n\n- What does improve mean? What aspect are we targeting? : User engagement with recommended videos\n- Are we looking at a specific platform (Mobile, Web, TV)? : Let's assume across all platforms.",
  },
];

export function AnswerSection({ answersCount }: { answersCount: number }) {
  const [myAnswer, setMyAnswer] = useState('');

  return (
    <div className="space-y-8 mt-10">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-all"
        >
          <Star className="w-4 h-4 mr-2" /> Save
        </Button>
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

      {/* AI Suggestion Banner (Optional) */}
      <Card className="p-6 border-indigo-100 bg-indigo-50/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-indigo-800 text-sm font-medium">
          💡 <b>Tip:</b> Bạn có thể sử dụng AI để chấm điểm câu trả lời của mình ngay lập tức.
        </p>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-4 h-9">
          Thử ngay
        </Button>
      </Card>

      {/* User Input Area */}
      <div className="flex gap-4 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <Avatar className="h-10 w-10 border border-slate-100 shrink-0 ml-2">
          <AvatarFallback className="bg-slate-100 text-slate-500 text-xs">You</AvatarFallback>
        </Avatar>
        <Input
          value={myAnswer}
          onChange={(e) => setMyAnswer(e.target.value)}
          placeholder="Chia sẻ cách bạn trả lời câu hỏi này..."
          className="border-none focus-visible:ring-0 bg-transparent h-12"
        />
        <Button disabled={!myAnswer} className="bg-indigo-600 rounded-xl mr-2">
          Gửi
        </Button>
      </div>

      {/* Answers List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-slate-400" />
            {answersCount || MOCK_ANSWERS.length} Answers
          </span>
          <Button variant="ghost" size="sm" className="text-slate-500 font-medium">
            🔥 Hot <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {MOCK_ANSWERS.map((answer) => (
          <div
            key={answer.id}
            className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={answer.user.avatar} />
              <AvatarFallback>{answer.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{answer.user.name}</span>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px]">
                    {answer.user.role}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400">{answer.date}</p>
              <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed italic border-l-2 border-slate-200 pl-4">
                {answer.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
