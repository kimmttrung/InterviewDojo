// components/MentorExperiencesSection.tsx
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { MentorExperience } from '../types/mentor-detail.types';

interface Props {
  experiences: MentorExperience[];
}

function CompanyLogo({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-slate-50 text-slate-500">
        <Building2 className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white">
      <img
        src={src}
        alt={alt}
        className="h-8 w-8 rounded-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function MentorExperiencesSection({ experiences }: Props) {
  if (!experiences?.length) return null;

  const formatMonthYear = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Experience</h2>
      <div className="space-y-4">
        {experiences.map((exp) => {
          const companyName = exp.companyName || exp.company?.name || 'Unknown company';
          const roleName = exp.roleName || exp.jobRole?.name || 'Unknown role';
          const companyLogoUrl = exp.companyLogoUrl || exp.company?.logoUrl;

          return (
            <div key={exp.id} className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <CompanyLogo src={companyLogoUrl} alt={companyName} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{roleName}</h3>
                    {exp.isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-600">{companyName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatMonthYear(exp.startDate)} -{' '}
                    {exp.isCurrent ? 'Present' : exp.endDate ? formatMonthYear(exp.endDate) : ''}
                  </p>
                </div>
              </div>

              {exp.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">{exp.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
