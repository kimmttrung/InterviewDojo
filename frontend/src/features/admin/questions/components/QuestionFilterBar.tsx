// src/features/admin/questions/components/QuestionFilterBar.tsx
import { Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface QuestionFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  difficultyFilter: string;
  onDifficultyFilterChange: (value: string) => void;
}

export const QuestionFilterBar = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
}: QuestionFilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tiêu đề..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        value={typeFilter || 'ALL'}
        onValueChange={(val) => onTypeFilterChange(val === 'ALL' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Loại câu hỏi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả</SelectItem>
          <SelectItem value="TECHNICAL">Technical</SelectItem>
          <SelectItem value="SYSTEM_DESIGN">System Design</SelectItem>
          <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
          <SelectItem value="CODING">Coding</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={difficultyFilter || 'ALL'}
        onValueChange={(val) => onDifficultyFilterChange(val === 'ALL' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Độ khó" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả</SelectItem>
          <SelectItem value="EASY">Easy</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HARD">Hard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
