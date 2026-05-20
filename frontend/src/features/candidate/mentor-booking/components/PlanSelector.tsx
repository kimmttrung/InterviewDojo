import { CoachingPlan } from '../types';

interface PlanSelectorProps {
  plans: CoachingPlan[];
  selectedPlanId: number | null;
  onSelect: (planId: number) => void;
}

export function PlanSelector({ plans, selectedPlanId, onSelect }: PlanSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Chọn dịch vụ</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
              selectedPlanId === plan.id
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold">{plan.title}</h3>
            {plan.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{plan.description}</p>
            )}
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm font-medium">{plan.duration} phút</span>
              <span className="text-lg font-bold">{plan.price.toLocaleString('vi-VN')} credit</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
