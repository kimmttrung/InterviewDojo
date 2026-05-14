// frontend/src/features/mentor/profile-management/components/SkillTable.tsx

import { Plus, Trash2, Info } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

import { useSkills } from '../hooks/useSkills';
import { useMentorProfileStore } from '@/stores/mentorProfile.store';

export const SkillTable = () => {
  const { data: skillsOptions = [] } = useSkills();
  const { skills, addSkill, updateSkill, removeSkill } = useMentorProfileStore();

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">Add your hard skills and soft skills</p>
        </div>

        <Button onClick={addSkill}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Phần Ghi chú Minh chứng Kỹ năng */}
      <div className="mb-6 flex gap-3 rounded-xl border bg-emerald-50/50 p-4 text-sm text-emerald-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Showcase your proficiency</p>
          <ul className="list-inside list-disc opacity-90">
            <li>GitHub repositories or specific code samples for Hard Skills.</li>
            <li>Professional certifications (AWS, Google, Microsoft, etc.).</li>
            <li>Portfolio links, blog posts, or case studies.</li>
            <li>Badges from reputable learning platforms (LeetCode, Coursera).</li>
          </ul>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Skill</TableHead>
              <TableHead className="w-[150px]">Type</TableHead>
              <TableHead className="w-[150px]">Experience (Months)</TableHead>
              <TableHead className="w-[180px]">Level</TableHead>
              <TableHead>Evidence URL</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {skills.map((skill, index) => {
              // 1. LỌC DANH SÁCH SKILL THEO TYPE
              const filteredSkillsOptions = skillsOptions.filter(
                (opt: any) => opt.type === skill.type,
              );

              return (
                <TableRow key={index}>
                  {/* Skill Selection */}
                  <TableCell>
                    <select
                      className="w-full rounded-md border bg-background p-2 text-sm focus:ring-2 focus:ring-ring"
                      value={skill.skillId ? skill.skillId.toString() : ''}
                      onChange={(event) =>
                        updateSkill(index, {
                          skillId: Number(event.target.value),
                        })
                      }
                    >
                      <option value="">Select skill</option>
                      {/* 2. DÙNG DANH SÁCH ĐÃ LỌC ĐỂ HIỂN THỊ */}
                      {filteredSkillsOptions.map((item: any) => (
                        <option key={item.id} value={item.id.toString()}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  {/* Skill Type */}
                  <TableCell>
                    <select
                      className="w-full rounded-md border bg-background p-2 text-sm focus:ring-2 focus:ring-ring"
                      value={skill.type}
                      onChange={(event) =>
                        updateSkill(index, {
                          type: event.target.value,
                          // 3. RESET SKILL_ID KHI ĐỔI TYPE ĐỂ TRÁNH LỖI DATA
                          skillId: 0,
                        })
                      }
                    >
                      <option value="HARDSKILL">Hard Skill</option>
                      <option value="SOFTSKILL">Soft Skill</option>
                    </select>
                  </TableCell>

                  {/* Experience Months with Validation */}
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 24"
                      value={skill.experienceMonths}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(event) => {
                        const val = Number(event.target.value);
                        updateSkill(index, {
                          experienceMonths: Math.max(0, val),
                        });
                      }}
                    />
                  </TableCell>

                  {/* Proficiency Level */}
                  <TableCell>
                    <select
                      className="w-full rounded-md border bg-background p-2 text-sm focus:ring-2 focus:ring-ring"
                      value={skill.level}
                      onChange={(event) =>
                        updateSkill(index, {
                          level: event.target.value,
                        })
                      }
                    >
                      <option value="LEARNING">Learning</option>
                      <option value="PRACTICED">Practiced</option>
                      <option value="PERSONAL_PROJECT">Personal Project</option>
                      <option value="PRODUCTION_READY">Production Ready</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </TableCell>

                  {/* Evidence URL Column */}
                  <TableCell>
                    <Input
                      placeholder="https://github.com/your-project"
                      value={skill.proofUrl || ''}
                      onChange={(event) =>
                        updateSkill(index, {
                          proofUrl: event.target.value,
                        })
                      }
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeSkill(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {skills.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No skills added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
