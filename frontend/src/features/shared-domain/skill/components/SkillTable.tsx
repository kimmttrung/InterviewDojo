import { useState, useEffect } from 'react';
import { Info, Plus, Trash2, Code, Users, Languages } from 'lucide-react';

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

type SkillType = 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';

export const SkillTable = ({ skills, addSkill, removeSkill, updateSkill }: Props) => {
  const { data: skillsOptions = [] } = useSkills();

  // State quản lý tab hướng dẫn đang hiển thị
  const [activeGuideTab, setActiveGuideTab] = useState<SkillType>('HARDSKILL');

  // Tự động chuyển Tab hướng dẫn sang loại skill vừa được thêm hoặc dòng cuối cùng thay đổi
  useEffect(() => {
    if (skills.length > 0) {
      const lastSkillType = skills[skills.length - 1].type;
      if (lastSkillType) {
        setActiveGuideTab(lastSkillType as SkillType);
      }
    }
  }, [skills.length]);

  // Đặc tả nội dung hướng dẫn động theo Tab
  const guideContent = {
    HARDSKILL: {
      evidence: 'GitHub • Portfolio • Certifications • Side Projects • Technical Blogs • LeetCode',
      levels: {
        AWARENESS:
          "Syntax & theory. Know what it solves but haven't built anything substantial yet.",
        FOUNDATION: 'Can do basic CRUD or tasks with templates/guidance. Used in coursework.',
        AUTONOMOUS:
          'Build features independently. Debug & deploy personal projects without hand-holding.',
        FLUENT:
          'Deep understanding under the hood. Handle optimization, complex bugs, and production code.',
        LEADERSHIP:
          'Architect/Tech Lead level. Decide technology stacks, mentor team, and handle crises.',
      },
    },
    SOFTSKILL: {
      evidence:
        'Team Lead Experience • Certificates • Presentation Videos • Recommendations • Conflict Resolution',
      levels: {
        AWARENESS: 'Understand the concept/importance but feel anxious or clumsy when applying it.',
        FOUNDATION:
          'Apply successfully in safe, familiar, or low-pressure environments (e.g., small internal teams).',
        AUTONOMOUS:
          'Use naturally in daily professional work. Handle client meetings or standard tasks confidently.',
        FLUENT:
          'Thrive under high pressure. Resolve intense conflicts, adapt quickly, and influence stakeholders.',
        LEADERSHIP:
          'Inspire others, drive organization culture, mentor colleagues, or act as a key speaker.',
      },
    },
    LANGUAGE: {
      evidence:
        'JLPT/TOEIC/IELTS Certificates • Tech Docs Read/Written • Speaking Demos • Subtitled Videos',
      levels: {
        AWARENESS: 'Basic greetings, alphabets, and common words. (Equivalent to A1 / N5).',
        FOUNDATION:
          'Read basic technical docs/tickets. Short text chat with thinking time. (Equivalent to A2-B1 / N4-N3).',
        AUTONOMOUS:
          'Work independently. Join daily standups, write tech docs, and report issues without translators. (B2 / N2).',
        FLUENT:
          'Natural reflex. Understand sarcasm, deep technical jargon, and negotiate effectively. (C1 / N1).',
        LEADERSHIP:
          'Native-like mastery. High-level translation, public speaking, or teaching technical concepts. (C2).',
      },
    },
  };

  const currentGuide = guideContent[activeGuideTab];

  return (
    <div className="rounded-3xl border bg-white p-7 shadow-sm">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Skills</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {skills.length} skills
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Add your technical, soft skills and languages. Strong evidence helps mentors and
            matching systems understand your strengths better.
          </p>
        </div>

        <Button onClick={addSkill} type="button" className="h-11 shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Guide Card Container */}
      <div className="mb-7 rounded-2xl border bg-gradient-to-br from-slate-50 to-blue-50/40 p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <Info className="mt-1 h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900">Skill Level Guide</h3>
              <p className="text-xs text-slate-500">
                Click tabs below to see specific guidelines for each category.
              </p>
            </div>
          </div>

          {/* Guide Controller Tabs */}
          <div className="flex p-1 bg-slate-200/70 rounded-xl self-start sm:self-center shadow-inner">
            <button
              type="button"
              onClick={() => setActiveGuideTab('HARDSKILL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeGuideTab === 'HARDSKILL'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="h-3.5 w-3.5" /> Hard
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('SOFTSKILL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeGuideTab === 'SOFTSKILL'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Soft
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('LANGUAGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeGuideTab === 'LANGUAGE'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Languages className="h-3.5 w-3.5" /> Lang
            </button>
          </div>
        </div>

        <div className="mb-4 border-t border-slate-200/60" />

        {/* Dynamic Matrix Layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">
                AWARENESS
              </span>
              <p className="text-slate-600 leading-relaxed">{currentGuide.levels.AWARENESS}</p>
            </div>
            <div>
              <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded">
                FOUNDATION
              </span>
              <p className="text-slate-600 leading-relaxed">{currentGuide.levels.FOUNDATION}</p>
            </div>
            <div>
              <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded">
                AUTONOMOUS
              </span>
              <p className="text-slate-600 leading-relaxed">{currentGuide.levels.AUTONOMOUS}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded">
                FLUENT
              </span>
              <p className="text-slate-600 leading-relaxed">{currentGuide.levels.FLUENT}</p>
            </div>
            <div>
              <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                LEADERSHIP
              </span>
              <p className="text-slate-600 leading-relaxed">{currentGuide.levels.LEADERSHIP}</p>
            </div>
            <div className="pt-2 border-t border-dashed border-slate-200">
              <b className="text-slate-800 text-xs block mb-1">
                Evidence Examples ({activeGuideTab.replace('SKILL', '')})
              </b>
              <p className="text-xs text-slate-500 italic leading-relaxed">
                {currentGuide.evidence}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="w-[25%]">Skill</TableHead>
              <TableHead className="w-[18%]">Type</TableHead>
              <TableHead className="w-[15%]">Experience (Months)</TableHead>
              <TableHead className="w-[17%]">Level</TableHead>
              <TableHead className="w-[20%]">Evidence URL</TableHead>
              <TableHead className="w-[5%]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {skills.map((skill, index) => {
              const filteredOptions = skillsOptions.filter((item) => item.type === skill.type);

              return (
                <TableRow key={index} className="hover:bg-slate-50/80">
                  {/* Select Skill Name */}
                  <TableCell>
                    <select
                      value={skill.skillId || ''}
                      className="w-full rounded-lg border bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        updateSkill(index, {
                          skillId: Number(e.target.value),
                        })
                      }
                    >
                      <option value="">Select skill</option>
                      {filteredOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  {/* Select Skill Type */}
                  <TableCell>
                    <select
                      value={skill.type}
                      className="w-full rounded-lg border bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const newType = e.target.value as SkillType;
                        updateSkill(index, {
                          type: newType as any,
                          skillId: 0, // Reset selected skill name matching older type
                        });
                        setActiveGuideTab(newType); // Auto shift guide focus on type click
                      }}
                    >
                      <option value="HARDSKILL">Hard Skill</option>
                      <option value="SOFTSKILL">Soft Skill</option>
                      <option value="LANGUAGE">Language</option>
                    </select>
                  </TableCell>

                  {/* Experience Inputs */}
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={skill.experienceMonths || ''}
                      placeholder="e.g. 12"
                      className="h-9 focus-visible:ring-blue-500"
                      onChange={(e) =>
                        updateSkill(index, {
                          experienceMonths: Math.max(0, Number(e.target.value)),
                        })
                      }
                    />
                  </TableCell>

                  {/* Dynamic Adjusted Levels */}
                  <TableCell>
                    <select
                      value={skill.level}
                      className="w-full rounded-lg border bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        updateSkill(index, {
                          level: e.target.value as any,
                        })
                      }
                      onFocus={() => {
                        if (skill.type) setActiveGuideTab(skill.type as SkillType);
                      }}
                    >
                      <option value="AWARENESS">Awareness</option>
                      <option value="FOUNDATION">Foundation</option>
                      <option value="AUTONOMOUS">Autonomous</option>
                      <option value="FLUENT">Fluent</option>
                      <option value="LEADERSHIP">Leadership</option>
                    </select>
                  </TableCell>

                  {/* Evidence inputs */}
                  <TableCell>
                    <Input
                      value={skill.proofUrl || ''}
                      placeholder={
                        skill.type === 'LANGUAGE'
                          ? 'Certificate Link / Demo video'
                          : skill.type === 'SOFTSKILL'
                            ? 'Recommendation / Project URL'
                            : 'GitHub / Portfolio Link'
                      }
                      className="h-9 focus-visible:ring-blue-500"
                      onChange={(e) =>
                        updateSkill(index, {
                          proofUrl: e.target.value,
                        })
                      }
                    />
                  </TableCell>

                  {/* Action Remove */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="hover:bg-red-50 group"
                      onClick={() => removeSkill(index)}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Empty States Handling */}
            {skills.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-slate-400">
                  No skills added yet. Click "Add Skill" to build your profile.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
