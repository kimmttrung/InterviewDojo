// src/pages/InterviewRoom/components/QuestionPanel.tsx
import { useState } from 'react';
import { Loader2, Shuffle, ChevronDown, Layers, SearchX } from 'lucide-react';
import { QuestionType } from '../../../../../shared-domain/question-bank/types';
import { TheoryView } from '../../../../../shared-domain/question-bank/components/QuestionDetail/TheoryView';
import { CodingDescription } from '../../../../../shared-domain/question-bank/components/QuestionDetail/CodingDescription';
import { Button } from '../../../../../../shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../../../../shared/components/ui/dropdown-menu';

interface QuestionPanelProps {
  question: any;
  onRandom: (type?: QuestionType, difficulty?: string) => void;
  isLoading: boolean;
  selectedType?: QuestionType;
  selectedDifficulty?: string;
  onTypeChange: (type?: QuestionType) => void;
  onDifficultyChange: (diff?: string) => void;
}

export function QuestionPanel({
  question,
  onRandom,
  isLoading,
  selectedType,
  selectedDifficulty,
  onTypeChange,
  onDifficultyChange,
}: QuestionPanelProps) {
  const parsedData = question?.data
    ? typeof question.data === 'string'
      ? JSON.parse(question.data)
      : question.data
    : null;

  return (
    <aside className="w-[30%] min-w-[350px] border-r border-slate-200 bg-white flex flex-col h-full">
      {/* 1. Filter Section (Giống QuestionFilters) */}
      <div className="p-4 border-b bg-slate-50/50 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Interview Assistant
        </h3>
        <div className="flex gap-2">
          {/* Type Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-lg border-indigo-100 text-indigo-600 bg-white grow"
              >
                <Layers className="w-3 h-3 mr-1" />
                {selectedType || 'Any Type'} <ChevronDown className="ml-auto w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white">
              <DropdownMenuItem onClick={() => onTypeChange(undefined)}>Any Type</DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.values(QuestionType).map((t) => (
                <DropdownMenuItem key={t} onClick={() => onTypeChange(t)}>
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Difficulty Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-lg border-slate-200 bg-white grow"
              >
                {selectedDifficulty || 'Difficulty'}{' '}
                <ChevronDown className="ml-auto w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white">
              <DropdownMenuItem onClick={() => onDifficultyChange(undefined)}>Any</DropdownMenuItem>
              {['EASY', 'MEDIUM', 'HARD'].map((d) => (
                <DropdownMenuItem key={d} onClick={() => onDifficultyChange(d)}>
                  {d}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" />
          </div>
        ) : question ? (
          // TRẠNG THÁI 1: CÓ DỮ LIỆU
          question.type === QuestionType.CODING ? (
            <CodingDescription question={question} />
          ) : (
            <div className="scale-95 origin-top-left w-[105%]">
              <TheoryView question={question} parsedData={parsedData} />
            </div>
          )
        ) : (
          // TRẠNG THÁI 2: KHÔNG CÓ DỮ LIỆU (Phân biệt giữa mới vào và lọc sai)
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            {/* 
          Nếu selectedType hoặc selectedDifficulty có giá trị 
          mà question vẫn null sau khi load => Nghĩa là lọc không ra kết quả 
      */}
            {selectedType || selectedDifficulty ? (
              <div className="text-center space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="bg-amber-50 p-4 rounded-full inline-block">
                  <SearchX size={40} className="text-amber-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-600">No questions found</p>
                  <p className="text-[11px] px-6 leading-relaxed opacity-60">
                    Try adjusting your filters or selecting a different category.
                  </p>
                </div>
              </div>
            ) : (
              /* Trạng thái mặc định khi mới vào phòng */
              <div className="opacity-30 text-center space-y-3">
                <Shuffle size={40} strokeWidth={1} className="mx-auto" />
                <p className="text-xs font-medium uppercase tracking-widest">
                  Roll the dice to start
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Random Button */}
      <div className="p-4 border-t bg-white">
        <Button
          onClick={() => onRandom(selectedType, selectedDifficulty)}
          disabled={isLoading}
          className="w-full h-11 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Shuffle className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              RANDOM QUESTION
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
