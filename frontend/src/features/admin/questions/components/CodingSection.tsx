import { UseFormRegister, Control } from 'react-hook-form';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { TestCaseEditor } from './TestCaseEditor';

interface CodingSectionProps {
  register: UseFormRegister<any>;
  control: Control<any>;
}

export const CodingSection = ({ register, control }: CodingSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={5}
          {...register('codingData.description')}
          placeholder="Problem description..."
        />
      </div>
      <div className="space-y-2">
        <Label>Constraints</Label>
        <Textarea rows={3} {...register('codingData.constraints')} placeholder="Constraints..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Time Limit (ms)</Label>
          <Input type="number" {...register('codingData.timeLimit', { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Memory Limit (KB)</Label>
          <Input type="number" {...register('codingData.memoryLimit', { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tags (comma separated)</Label>
        <Input {...register('codingData.tags')} placeholder="array, sorting, dp" />
      </div>
      <div className="space-y-2">
        <Label>Hints (comma separated)</Label>
        <Input {...register('codingData.hints')} placeholder="Hint1, Hint2" />
      </div>
      <div className="space-y-2">
        <Label>Codeforces Link (optional)</Label>
        <Input {...register('codingData.codeforcesLink')} placeholder="https://..." />
      </div>
      <TestCaseEditor register={register} control={control} />
    </div>
  );
};
