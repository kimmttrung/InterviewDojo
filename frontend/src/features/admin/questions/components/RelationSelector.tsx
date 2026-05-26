import { useState, useMemo } from 'react';
import { Check, Plus, X } from 'lucide-react';
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

  const handleRemove = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    onChange(selectedIds.filter((i) => i !== id));
  };

  const handleQuickAdd = async (name: string) => {
    const newOption = await onQuickAdd(name);
    onChange([...selectedIds, newOption.id]);
    return newOption;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start min-h-10 h-auto py-2"
          >
            {selectedOptions.length ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map((opt) => (
                  <Badge key={opt.id} variant="secondary" className="flex items-center gap-1 pr-1">
                    {opt.name}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(e, opt.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRemove(e as any, opt.id)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground font-normal">
                {placeholder || `Chọn ${entityName}...`}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        {/* FIX: bg-background ensures the popover is never transparent */}
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 bg-background border shadow-md"
          align="start"
        >
          <Command>
            <CommandInput placeholder={`Tìm ${entityName}...`} />
            <CommandEmpty className="py-3 text-center text-sm">
              <p className="text-muted-foreground mb-2">Không tìm thấy "{entityName}"</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setQuickAddOpen(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Thêm mới
              </Button>
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={`${opt.id}__${opt.name}`}
                  onSelect={() => handleSelect(opt.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1">{opt.name}</span>
                    {selectedIds.includes(opt.id) && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {options.length > 0 && (
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => {
                    setOpen(false);
                    setQuickAddOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" /> Thêm {entityName} mới
                </Button>
              </div>
            )}
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
