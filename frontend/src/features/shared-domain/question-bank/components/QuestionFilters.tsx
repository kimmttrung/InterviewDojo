import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../shared/components/ui/dropdown-menu';
import { ChevronDown, Code, Brain, MessageCircle, PlayCircle, Layers } from 'lucide-react';
import { QuestionType } from '../types';
import { Button } from '../../../../shared/components/ui/button';

interface QuestionFiltersProps {
  currentType?: QuestionType; // Đảm bảo dùng đúng Enum Type
  difficulty?: string;
  onTypeChange: (type?: QuestionType) => void;
  onDifficultyChange: (diff?: string) => void;
}

// Map label để hiển thị trên Button cho đẹp
const typeLabels: Record<QuestionType, { label: string; icon: any }> = {
  [QuestionType.TECHNICAL]: { label: 'Technical', icon: Code },
  [QuestionType.SYSTEM_DESIGN]: { label: 'System Design', icon: Brain },
  [QuestionType.BEHAVIORAL]: { label: 'Behavioral', icon: MessageCircle },
  [QuestionType.CODING]: { label: 'Coding', icon: PlayCircle },
};

export function QuestionFilters({
  currentType,
  difficulty,
  onTypeChange,
  onDifficultyChange,
}: QuestionFiltersProps) {
  // Lấy icon và label tương ứng với type đang chọn
  const ActiveIcon = currentType ? typeLabels[currentType].icon : Layers;

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
      {/* Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-lg border-indigo-600 text-indigo-600 font-bold"
          >
            <ActiveIcon className="mr-2 w-4 h-4" />
            {currentType ? typeLabels[currentType].label : 'All Type'}
            <ChevronDown className="ml-2 w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="bg-white w-56">
          <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
          {/* <DropdownMenuItem onClick={() => onTypeChange(undefined)}>All Types</DropdownMenuItem> */}
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onTypeChange(QuestionType.TECHNICAL)}>
            <Code className="w-4 h-4 mr-2 text-green-500" /> Technical
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onTypeChange(QuestionType.SYSTEM_DESIGN)}>
            <Brain className="w-4 h-4 mr-2 text-pink-500" /> System Design
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onTypeChange(QuestionType.BEHAVIORAL)}>
            <MessageCircle className="w-4 h-4 mr-2 text-purple-500" /> Behavioral
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onTypeChange(QuestionType.CODING)}>
            <PlayCircle className="w-4 h-4 mr-2 text-blue-500" /> Coding
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Difficulty Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-lg font-medium">
            {difficulty || 'Difficulty'} <ChevronDown className="ml-2 w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white">
          <DropdownMenuItem onClick={() => onDifficultyChange(undefined)}>
            All Difficulty
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDifficultyChange('EASY')}>Easy</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDifficultyChange('MEDIUM')}>Medium</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDifficultyChange('HARD')}>Hard</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
