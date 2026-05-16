// components/MentorExperiencesSection.tsx
import type { MentorExperience } from '../types/mentor-detail.types';

interface Props {
  experiences: MentorExperience[];
}

export function MentorExperiencesSection({ experiences }: Props) {
  if (!experiences?.length) return null;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Experience</h2>
      <div className="space-y-4">
        {experiences.map((exp) => (
          <div key={exp.id} className="rounded-xl border p-4">
            <div className="flex items-center gap-3">
              {exp.companyLogoUrl && (
                <img
                  src={exp.companyLogoUrl}
                  alt={exp.companyName}
                  className="h-8 w-8 rounded-full object-contain"
                />
              )}
              <div>
                <h3 className="font-semibold">{exp.roleName}</h3>
                <p className="text-sm text-slate-600">{exp.companyName}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {new Date(exp.startDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })}{' '}
              –{' '}
              {exp.isCurrent
                ? 'Present'
                : exp.endDate
                  ? new Date(exp.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })
                  : ''}
              {exp.isCurrent && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  Current
                </span>
              )}
            </div>
            {exp.description && <p className="mt-2 text-sm text-slate-600">{exp.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
