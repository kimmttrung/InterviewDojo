import { useState, useMemo } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/shared/components/ui/command';
import { QuickAddDialog } from './QuickAddDialog';

interface Option {
  id: number;
  name: string;
}

interface RelationSelectorProps {
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  entityName: string;
  onQuickAdd: (name: string) => Promise<Option>;
}

export const RelationSelector = ({
  options,
  selectedIds,
  onChange,
  placeholder,
  entityName,
  onQuickAdd,
}: RelationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const optionMap = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const selectedOptions = selectedIds.map((id) => optionMap.get(id)).filter(Boolean) as Option[];

  const handleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleQuickAdd = async (name: string) => {
    const newOption = await onQuickAdd(name);
    onChange([...selectedIds, newOption.id]);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedOptions.length ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map((opt) => (
                  <Badge key={opt.id} variant="secondary">
                    {opt.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder || `Chọn ${entityName}`}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Tìm ${entityName}...`} />
            <CommandEmpty>
              Không tìm thấy
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setQuickAddOpen(true);
                }}
                className="ml-2"
              >
                <Plus className="h-3 w-3 mr-1" /> Thêm mới
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem key={opt.id} onSelect={() => handleSelect(opt.id)}>
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1">{opt.name}</span>
                    {selectedIds.includes(opt.id) && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <QuickAddDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAdd}
        title={`Thêm ${entityName} mới`}
        label={`Tên ${entityName}`}
        placeholder={`Nhập tên ${entityName}...`}
      />
    </>
  );
};
