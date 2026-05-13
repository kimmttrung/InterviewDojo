import type { MentorExperience } from '../types/mentor.types';

export default function MentorExperienceSection({
  experiences,
}: {
  experiences: MentorExperience[];
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Kinh nghiệm</h2>

      {experiences.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có kinh nghiệm.</p>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="rounded-xl border p-4">
              <h3 className="font-semibold">{exp.jobRole?.name}</h3>
              <p className="text-gray-600">{exp.company?.name}</p>

              <p className="text-sm text-gray-500">
                {new Date(exp.startDate).toLocaleDateString('vi-VN')} -{' '}
                {exp.isCurrent || !exp.endDate
                  ? 'Hiện tại'
                  : new Date(exp.endDate).toLocaleDateString('vi-VN')}
              </p>

              {exp.description && <p className="mt-2 text-sm text-gray-700">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
