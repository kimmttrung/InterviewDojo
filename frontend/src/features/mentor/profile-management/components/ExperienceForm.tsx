// frontend/src/features/mentor/profile-management/components/ExperienceTable.tsx

import { Plus, Trash2, Info } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

import { useCompanies } from '../hooks/useCompanies';
import { useJobRoles } from '../hooks/useJobRoles';
import { useMentorProfileStore } from '@/stores/mentorProfile.store';

// ==========================================
// COMPONENT CON: Xử lý hiển thị từng Experience
// ==========================================
const ExperienceCard = ({
  experience,
  index,
  updateExperience,
  removeExperience,
  allCompanies,
  allJobRoles,
}: {
  experience: any;
  index: number;
  updateExperience: any;
  removeExperience: any;
  allCompanies: any[];
  allJobRoles: any[];
}) => {
  return (
    <div className="relative rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header của Card */}
      <div className="mb-4 flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Experience #{index + 1}</h3>
          {/* Hiển thị luôn Title ở ngoài cho đẹp nếu có data */}
          {experience.companyName && experience.roleName && (
            <p className="text-sm font-medium text-blue-600">
              {experience.roleName} @ {experience.companyName}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeExperience(index)}
          className="text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ===================== Ô CHỌN COMPANY ===================== */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Company</label>
          <select
            className="w-full rounded-md border border-slate-200 bg-background p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={experience.companyId ? String(experience.companyId) : ''}
            onChange={(e) => {
              // Khi user chọn công ty mới, cập nhật cả ID lẫn Tên vào store
              const selectedId = Number(e.target.value);
              const selectedName = allCompanies.find((c) => c.id === selectedId)?.name || '';
              updateExperience(index, { companyId: selectedId, companyName: selectedName });
            }}
          >
            <option value="" disabled>
              Select company
            </option>

            {/* Nếu lấy từ response cũ mà danh sách GET_ALL chưa load kịp thì in cái này ra */}
            {experience.companyId && !allCompanies.some((c) => c.id === experience.companyId) && (
              <option value={String(experience.companyId)}>
                {experience.companyName || 'Unknown Company'}
              </option>
            )}

            {allCompanies.map((company: any) => (
              <option key={company.id} value={String(company.id)}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* ===================== Ô CHỌN JOB ROLE ===================== */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Job Role</label>
          <select
            className="w-full rounded-md border border-slate-200 bg-background p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={experience.jobRoleId ? String(experience.jobRoleId) : ''}
            onChange={(e) => {
              const selectedId = Number(e.target.value);
              const selectedName = allJobRoles.find((r) => r.id === selectedId)?.name || '';
              updateExperience(index, { jobRoleId: selectedId, roleName: selectedName });
            }}
          >
            <option value="" disabled>
              Select role
            </option>

            {experience.jobRoleId && !allJobRoles.some((r) => r.id === experience.jobRoleId) && (
              <option value={String(experience.jobRoleId)}>
                {experience.roleName || 'Unknown Role'}
              </option>
            )}

            {allJobRoles.map((role: any) => (
              <option key={role.id} value={String(role.id)}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* ===================== CÁC Ô KHÁC ===================== */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Start Date</label>
          <Input
            type="date"
            value={experience.startDate || ''}
            onChange={(e) => updateExperience(index, { startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">End Date</label>
          <Input
            type="date"
            min={experience.startDate}
            value={experience.endDate || ''}
            disabled={experience.isCurrent}
            onChange={(e) => updateExperience(index, { endDate: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Evidence URL</label>
          <Input
            type="url"
            placeholder="https://drive.google.com/..."
            value={experience.proofUrl || ''}
            onChange={(e) => updateExperience(index, { proofUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <Textarea
            placeholder="Describe your responsibilities and achievements..."
            rows={4}
            value={experience.description || ''}
            onChange={(e) => updateExperience(index, { description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export const ExperienceTable = () => {
  const { data: companies = [] } = useCompanies();
  const { data: jobRoles = [] } = useJobRoles();

  const { experiences, addExperience, removeExperience, updateExperience } =
    useMentorProfileStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Working Experiences</h2>
          <p className="text-sm text-muted-foreground">
            Add the professional experiences you want to showcase.
          </p>
        </div>
        <Button onClick={addExperience}>
          <Plus className="mr-2 h-4 w-4" />
          Add Experience
        </Button>
      </div>

      <div className="flex gap-3 rounded-xl border bg-blue-50/50 p-4 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">What counts as evidence?</p>
          <ul className="list-inside list-disc opacity-90">
            <li>Offer letters, employment contracts, or work email verification.</li>
            <li>Public LinkedIn certificates or company-issued recognition.</li>
          </ul>
          <p className="mt-2 text-xs italic opacity-70">
            * Please upload files to Google Drive/Dropbox and paste the shared link here.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {experiences.map((experience, index) => (
          <ExperienceCard
            key={index}
            index={index}
            experience={experience}
            updateExperience={updateExperience}
            removeExperience={removeExperience}
            allCompanies={companies}
            allJobRoles={jobRoles}
          />
        ))}

        {experiences.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-sm text-slate-500">No experience records added yet.</p>
            <Button variant="link" onClick={addExperience} className="mt-2">
              + Add your first experience
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
