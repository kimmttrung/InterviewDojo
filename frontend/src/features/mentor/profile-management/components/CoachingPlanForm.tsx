// frontend/src/features/mentor/profile-management/components/CoachingPlanTable.tsx

import { useState } from 'react';
import { Info, Plus, Trash2, MessageSquareText } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

import { useCoachingCategories } from '../hooks/useCoachingCategories';
import { useMentorProfileStore } from '@/stores/mentorProfile.store';

const durationOptions = [
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '1 Hour 30 Minutes', value: 90 },
  { label: '2 Hours', value: 120 },
  { label: '2 Hours 30 Minutes', value: 150 },
  { label: '3 Hours', value: 180 },
];

export const CoachingPlanTable = () => {
  const { data: categories = [] } = useCoachingCategories();
  const { coachingPlans, addCoachingPlan, updateCoachingPlan, removeCoachingPlan } =
    useMentorProfileStore();

  // State quản lý việc mở Dialog của Plan nào
  const [activePlanIndex, setActivePlanIndex] = useState<number | null>(null);

  // --- Các hàm xử lý Form Questions ---
  const handleAddQuestion = (planIndex: number) => {
    const plan = coachingPlans[planIndex];
    const currentQuestions = plan.questions || [];
    updateCoachingPlan(planIndex, {
      questions: [...currentQuestions, { question: '', type: 'TEXT', isRequired: false }],
    });
  };

  const handleUpdateQuestion = (planIndex: number, qIndex: number, field: string, value: any) => {
    const plan = coachingPlans[planIndex];
    const updatedQuestions = [...(plan.questions || [])];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], [field]: value };
    updateCoachingPlan(planIndex, { questions: updatedQuestions });
  };

  const handleRemoveQuestion = (planIndex: number, qIndex: number) => {
    const plan = coachingPlans[planIndex];
    const updatedQuestions = [...(plan.questions || [])];
    updatedQuestions.splice(qIndex, 1);
    updateCoachingPlan(planIndex, { questions: updatedQuestions });
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Coaching Services</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the mentoring services you provide for candidates.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>Create different coaching services for different interview needs.</p>
              <p>Example: Frontend Mock Interview, System Design Coaching...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {coachingPlans.map((plan, index) => (
          <div key={index} className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Service #{index + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  Configure your mentoring service information
                </p>
              </div>
              <Button variant="destructive" size="icon" onClick={() => removeCoachingPlan(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Form Fields: Title, Category, Duration, Price, Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Service Title</label>
                <Input
                  placeholder="Frontend Mock Interview"
                  value={plan.title}
                  onChange={(e) => updateCoachingPlan(index, { title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={plan.categoryId}
                  onChange={(e) =>
                    updateCoachingPlan(index, { categoryId: Number(e.target.value) })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={plan.duration}
                  onChange={(e) => updateCoachingPlan(index, { duration: Number(e.target.value) })}
                >
                  {durationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="50"
                  value={plan.price}
                  onChange={(e) =>
                    updateCoachingPlan(index, { price: Math.max(0, Number(e.target.value)) })
                  }
                />
              </div>

              {/* Nút mở Modal quản lý câu hỏi form */}
              <div className="flex items-end space-y-2">
                <Button
                  variant="outline"
                  className="w-full bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setActivePlanIndex(index)}
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Pre-booking Form ({plan.questions?.length || 0})
                </Button>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  rows={4}
                  placeholder="Describe what candidates will receive..."
                  value={plan.description}
                  onChange={(e) => updateCoachingPlan(index, { description: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          className="h-14 w-full border-dashed text-base"
          onClick={addCoachingPlan}
        >
          <Plus className="mr-2 h-5 w-5" /> Add New Coaching Service
        </Button>
      </div>

      {/* ================= MODAL QUẢN LÝ CÂU HỎI ================= */}
      <Dialog
        open={activePlanIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActivePlanIndex(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pre-booking Questions</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Candidates will answer these questions before booking your service.
            </p>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
            {activePlanIndex !== null &&
              coachingPlans[activePlanIndex]?.questions?.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4"
                >
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Enter your question (e.g., Please share your resume link)"
                      value={q.question}
                      onChange={(e) =>
                        handleUpdateQuestion(activePlanIndex, qIndex, 'question', e.target.value)
                      }
                    />

                    <div className="flex items-center gap-4">
                      <select
                        className="rounded-md border bg-background p-2 text-sm"
                        value={q.type}
                        onChange={(e) =>
                          handleUpdateQuestion(activePlanIndex, qIndex, 'type', e.target.value)
                        }
                      >
                        <option value="TEXT">Text Answer</option>
                        <option value="FILE">File Upload</option>
                      </select>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={q.isRequired}
                          onChange={(e) =>
                            handleUpdateQuestion(
                              activePlanIndex,
                              qIndex,
                              'isRequired',
                              e.target.checked,
                            )
                          }
                        />
                        Required
                      </label>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRemoveQuestion(activePlanIndex, qIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

            {activePlanIndex !== null &&
              (!coachingPlans[activePlanIndex]?.questions ||
                coachingPlans[activePlanIndex].questions.length === 0) && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No questions added yet. Click below to add one.
                </div>
              )}
          </div>

          <div className="mt-4 border-t pt-4">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => activePlanIndex !== null && handleAddQuestion(activePlanIndex)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
