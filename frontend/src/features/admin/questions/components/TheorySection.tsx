import { useFieldArray, UseFormRegister, Control } from 'react-hook-form';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface TheorySectionProps {
  register: UseFormRegister<any>;
  control: Control<any>;
}

// useFieldArray stores string primitives as { value: string } internally
// So we must use `.value` when registering string array fields
export const TheorySection = ({ register, control }: TheorySectionProps) => {
  const {
    fields: tipsFields,
    append: addTip,
    remove: removeTip,
  } = useFieldArray({ control, name: 'theoryData.tips' });

  const {
    fields: keyPointsFields,
    append: addKeyPoint,
    remove: removeKeyPoint,
  } = useFieldArray({ control, name: 'theoryData.keyPoints' });

  const {
    fields: followUpsFields,
    append: addFollowUp,
    remove: removeFollowUp,
  } = useFieldArray({ control, name: 'theoryData.followUps' });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Câu hỏi</Label>
        <Textarea rows={5} {...register('theoryData.question')} placeholder="Nội dung câu hỏi..." />
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <Label>Tips (gợi ý)</Label>
        {tipsFields.map((field, idx) => (
          <div key={field.id} className="flex gap-2">
            {/* React Hook Form wraps primitives in { id, value } for fieldArray */}
            <Input {...register(`theoryData.tips.${idx}`)} placeholder={`Tip ${idx + 1}`} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeTip(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addTip('')}>
          <Plus className="h-4 w-4 mr-1" /> Thêm tip
        </Button>
      </div>

      {/* Key Points */}
      <div className="space-y-3">
        <Label>Key Points</Label>
        {keyPointsFields.map((field, idx) => (
          <div key={field.id} className="flex gap-2">
            <Input
              {...register(`theoryData.keyPoints.${idx}`)}
              placeholder={`Key point ${idx + 1}`}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeKeyPoint(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addKeyPoint('')}>
          <Plus className="h-4 w-4 mr-1" /> Thêm key point
        </Button>
      </div>

      {/* Follow-ups */}
      <div className="space-y-3">
        <Label>Follow-up questions</Label>
        {followUpsFields.map((field, idx) => (
          <div key={field.id} className="flex gap-2">
            <Input
              {...register(`theoryData.followUps.${idx}`)}
              placeholder={`Follow-up ${idx + 1}`}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeFollowUp(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addFollowUp('')}>
          <Plus className="h-4 w-4 mr-1" /> Thêm follow-up
        </Button>
      </div>
    </div>
  );
};
