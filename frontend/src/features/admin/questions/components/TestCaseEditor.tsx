import { useFieldArray, UseFormRegister, Control, Controller } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';

interface TestCaseEditorProps {
  register: UseFormRegister<any>;
  control: Control<any>;
}

export const TestCaseEditor = ({ register, control }: TestCaseEditorProps) => {
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'codingData.testCases',
  });

  const addTestCase = () => {
    append({
      input: '',
      expectedOutput: '',
      isSample: false,
      isHidden: false,
      points: 1,
      order: fields.length,
      explanation: '',
    });
  };

  const moveUp = (index: number) => {
    if (index > 0) swap(index, index - 1);
  };
  const moveDown = (index: number) => {
    if (index < fields.length - 1) swap(index, index + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Test Cases</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
          <Plus className="h-4 w-4 mr-1" /> Thêm test case
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
          Chưa có test case nào. Nhấn "Thêm test case" để bắt đầu.
        </p>
      )}

      {fields.map((field, idx) => (
        <Card key={field.id}>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Test Case #{idx + 1}</CardTitle>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
              >
                <MoveUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveDown(idx)}
                disabled={idx === fields.length - 1}
              >
                <MoveDown className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Input</Label>
                <Textarea
                  rows={3}
                  {...register(`codingData.testCases.${idx}.input`)}
                  placeholder="Input data"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label className="mb-1 block">Expected Output</Label>
                <Textarea
                  rows={3}
                  {...register(`codingData.testCases.${idx}.expectedOutput`)}
                  placeholder="Output"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Explanation (optional)</Label>
              <Input
                {...register(`codingData.testCases.${idx}.explanation`)}
                placeholder="Giải thích test case này..."
              />
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              {/* Switch must use Controller — register() doesn't work with Radix Switch */}
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`codingData.testCases.${idx}.isSample`}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id={`isSample-${idx}`}
                    />
                  )}
                />
                <Label htmlFor={`isSample-${idx}`} className="cursor-pointer">
                  Sample (hiển thị cho user)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`codingData.testCases.${idx}.isHidden`}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id={`isHidden-${idx}`}
                    />
                  )}
                />
                <Label htmlFor={`isHidden-${idx}`} className="cursor-pointer">
                  Hidden (ẩn input/output)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor={`points-${idx}`}>Points</Label>
                <Input
                  id={`points-${idx}`}
                  type="number"
                  min={0}
                  step={0.5}
                  {...register(`codingData.testCases.${idx}.points`, { valueAsNumber: true })}
                  className="w-20"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
