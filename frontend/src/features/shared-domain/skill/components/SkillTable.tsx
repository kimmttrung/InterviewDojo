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

import { useSkills } from '@/features/shared-domain/skill/hooks/useSkill';

import { UserSkillPayload } from '../types/skill';

type Props = {
  skills: UserSkillPayload[];

  addSkill: () => void;

  removeSkill: (index: number) => void;

  updateSkill: (index: number, payload: Partial<UserSkillPayload>) => void;
};

export const SkillTable = ({ skills, addSkill, removeSkill, updateSkill }: Props) => {
  const { data: skillsOptions = [] } = useSkills();

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Skills</h2>

          <p className="text-sm text-muted-foreground">Add hard skills and soft skills</p>
        </div>

        <Button type="button" onClick={addSkill}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      <div
        className="
        mb-6
        flex
        gap-3
        rounded-xl
        border
        bg-emerald-50/50
        p-4
        text-sm
        text-emerald-700
      "
      >
        <Info
          className="
          mt-0.5
          h-4
          w-4
          shrink-0
        "
        />

        <div>
          <p className="font-medium">Showcase your proficiency</p>

          <ul
            className="
            list-inside
            list-disc
            opacity-90
          "
          >
            <li>GitHub repositories</li>

            <li>Certifications</li>

            <li>Portfolio links</li>

            <li>Learning platform badges</li>
          </ul>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill</TableHead>

              <TableHead>Type</TableHead>

              <TableHead>Experience</TableHead>

              <TableHead>Level</TableHead>

              <TableHead>Evidence URL</TableHead>

              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {skills.map((skill, index) => {
              const filtered = skillsOptions.filter((item) => item.type === skill.type);

              return (
                <TableRow key={index}>
                  <TableCell>
                    <select
                      className="
                        w-full
                        rounded-md
                        border
                        bg-background
                        p-2
                      "
                      value={skill.skillId || ''}
                      onChange={(event) =>
                        updateSkill(index, {
                          skillId: Number(event.target.value),
                        })
                      }
                    >
                      <option value="">Select skill</option>

                      {filtered.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  <TableCell>
                    <select
                      value={skill.type}
                      className="
                        w-full
                        rounded-md
                        border
                        p-2
                      "
                      onChange={(event) =>
                        updateSkill(index, {
                          type: event.target.value as any,

                          skillId: 0,
                        })
                      }
                    >
                      <option value="HARDSKILL">Hard Skill</option>

                      <option value="SOFTSKILL">Soft Skill</option>
                    </select>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={skill.experienceMonths}
                      onChange={(event) =>
                        updateSkill(index, {
                          experienceMonths: Math.max(
                            0,

                            Number(event.target.value),
                          ),
                        })
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <select
                      className="
                        w-full
                        rounded-md
                        border
                        p-2
                      "
                      value={skill.level}
                      onChange={(event) =>
                        updateSkill(index, {
                          level: event.target.value as any,
                        })
                      }
                    >
                      <option value="LEARNING">Learning</option>

                      <option value="PRACTICED">Practiced</option>

                      <option value="PERSONAL_PROJECT">Personal Project</option>

                      <option value="PRODUCTION_READY">Production</option>

                      <option value="EXPERT">Expert</option>
                    </select>
                  </TableCell>

                  <TableCell>
                    <Input
                      value={skill.proofUrl || ''}
                      placeholder="https://..."
                      onChange={(event) =>
                        updateSkill(index, {
                          proofUrl: event.target.value,
                        })
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
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
                <TableCell
                  colSpan={6}
                  className="
                  h-20
                  text-center
                "
                >
                  No skills added
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
