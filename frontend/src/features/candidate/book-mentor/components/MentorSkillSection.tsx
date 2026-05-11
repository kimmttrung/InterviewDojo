import type { MentorSkill } from '../types/mentor.types';

const levelColor: Record<string, string> = {
  LEARNING: 'bg-gray-100 text-gray-700',
  PRACTICED: 'bg-blue-100 text-blue-700',
  PERSONAL_PROJECT: 'bg-purple-100 text-purple-700',
  PRODUCTION_READY: 'bg-green-100 text-green-700',
  EXPERT: 'bg-orange-100 text-orange-700',
};

const formatMonth = (months?: number) => {
  if (!months) return 'Chưa cập nhật';
  if (months < 12) return `${months} tháng`;
  return `${Math.floor(months / 12)} năm ${months % 12} tháng`;
};

export default function MentorSkillSection({ skills }: { skills: MentorSkill[] }) {
  const hardSkills = skills.filter((item) => item.type === 'HARDSKILL');
  const softSkills = skills.filter((item) => item.type === 'SOFTSKILL');

  const renderSkills = (title: string, data: MentorSkill[]) => (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {data.map((skill) => (
            <div
              key={skill.id}
              title={`Trình độ: ${skill.level}. Thời gian sử dụng: ${formatMonth(
                skill.experienceMonths,
              )}`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                levelColor[skill.level] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {skill.name}
              <span className="ml-2 opacity-70">· {formatMonth(skill.experienceMonths)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Kỹ năng</h2>
      {renderSkills('Hard skills', hardSkills)}
      {renderSkills('Soft skills', softSkills)}
    </section>
  );
}
