import { Info, Plus, Trash2 } from 'lucide-react';

import { useSkills } from '@/features/shared-domain/skill/hooks/useSkill';

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
    <div
      className="
      rounded-3xl
      border
      bg-white
      p-7
      shadow-sm
    "
    >
      {/* Header */}

      <div
        className="
        mb-7
        flex
        flex-col
        gap-4
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
      >
        <div>
          <div className="flex items-center gap-3">
            <h2
              className="
              text-2xl
              font-bold
              text-slate-900
            "
            >
              Skills
            </h2>

            <span
              className="
              rounded-full
              bg-blue-100
              px-3
              py-1
              text-xs
              font-semibold
              text-blue-700
            "
            >
              {skills.length} skills
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Add your technical and soft skills. Strong evidence helps mentors and matching systems
            understand your strengths better.
          </p>
        </div>

        <Button onClick={addSkill} type="button" className="h-11">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Guide */}

      <div
        className="
        mb-7
        rounded-2xl
        border
        bg-gradient-to-br
        from-slate-50
        to-blue-50
        p-5
      "
      >
        <div className="mb-4 flex gap-3">
          <Info
            className="
            mt-1
            h-5
            w-5
            text-blue-600
          "
          />

          <div>
            <h3
              className="
              font-semibold
              text-slate-900
            "
            >
              Skill Level Guide
            </h3>

            <p className="text-sm text-slate-500">
              Choose levels honestly. Better data improves mentor recommendations.
            </p>
          </div>
        </div>

        <div
          className="
          grid
          gap-4
          lg:grid-cols-2
        "
        >
          <div className="space-y-2 text-sm">
            <div>
              <b>LEARNING</b>

              <p className="text-slate-600">Learning fundamentals.</p>
            </div>

            <div>
              <b>PRACTICED</b>

              <p className="text-slate-600">Used in exercises or coursework.</p>
            </div>

            <div>
              <b>PERSONAL PROJECT</b>

              <p className="text-slate-600">Built side projects using it.</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <b>PRODUCTION READY</b>

              <p className="text-slate-600">Applied in deployable products.</p>
            </div>

            <div>
              <b>EXPERT</b>

              <p className="text-slate-600">Deep knowledge and leadership.</p>
            </div>

            <div>
              <b>Evidence Examples</b>

              <p className="text-slate-600">
                GitHub • Portfolio • AWS Cert • LeetCode • Blog • Open Source • Demo Video
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}

      <div
        className="
        overflow-hidden
        rounded-2xl
        border
      "
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead>Skill</TableHead>

              <TableHead>Type</TableHead>

              <TableHead>Experience</TableHead>

              <TableHead>Level</TableHead>

              <TableHead>Evidence</TableHead>

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
                      value={skill.skillId || ''}
                      className="
                      w-full
                      rounded-lg
                      border
                      p-2
                    "
                      onChange={(e) =>
                        updateSkill(index, {
                          skillId: Number(e.target.value),
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
                      rounded-lg
                      border
                      p-2
                    "
                      onChange={(e) =>
                        updateSkill(index, {
                          type: e.target.value as any,

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
                      placeholder="24"
                      onChange={(e) =>
                        updateSkill(index, {
                          experienceMonths: Math.max(0, Number(e.target.value)),
                        })
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <select
                      value={skill.level}
                      className="
                      w-full
                      rounded-lg
                      border
                      p-2
                    "
                      onChange={(e) =>
                        updateSkill(index, {
                          level: e.target.value as any,
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

                  <TableCell>
                    <Input
                      value={skill.proofUrl || ''}
                      placeholder="GitHub / Portfolio / Certificate"
                      onChange={(e) =>
                        updateSkill(index, {
                          proofUrl: e.target.value,
                        })
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removeSkill(index)}
                    >
                      <Trash2
                        className="
                        h-4
                        w-4
                        text-red-500
                      "
                      />
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
                  h-28
                  text-center
                  text-slate-500
                "
                >
                  No skills added yet. Click "Add Skill" to begin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
