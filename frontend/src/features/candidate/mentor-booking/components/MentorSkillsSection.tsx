// components/MentorSkillsSection.tsx
import { Badge } from '@/shared/components/ui/badge';
import type { MentorSkill } from '../types/mentor-detail.types';

interface Props {
  skills: MentorSkill[];
}

const LEVEL_COLORS: Record<string, string> = {
  LEARNING: 'bg-gray-100 text-gray-700',
  PRACTICED: 'bg-blue-100 text-blue-700',
  PERSONAL_PROJECT: 'bg-green-100 text-green-700',
  PRODUCTION_READY: 'bg-purple-100 text-purple-700',
  EXPERT: 'bg-amber-100 text-amber-700',
};

export function MentorSkillsSection({ skills }: Props) {
  if (!skills?.length) return null;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Skills</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <div key={skill.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{skill.name}</span>
              <Badge
                variant="secondary"
                className={`text-xs ${skill.type === 'HARDSKILL' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}
              >
                {skill.type === 'HARDSKILL' ? 'Hard Skill' : 'Soft Skill'}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
              <span>{skill.experienceMonths} months</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LEVEL_COLORS[skill.level] || 'bg-gray-100'}`}
              >
                {skill.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
