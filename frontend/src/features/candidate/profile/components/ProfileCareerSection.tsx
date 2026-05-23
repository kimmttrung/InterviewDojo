import { Target, Sparkles } from 'lucide-react';

import { Label } from '@/shared/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

import { Dispatch, SetStateAction } from 'react';

import { TargetRole } from '../../target-role/types/target-role.type';

export type ProfileFormData = {
  name: string;
  bio: string;
  targetRoleId: number | null;
  experienceYears: number;
  githubLink: string;
  linkedInLink: string;
};

type Props = {
  formData: ProfileFormData;

  setFormData: Dispatch<SetStateAction<ProfileFormData>>;

  roles: TargetRole[];
};

export const ProfileCareerSection = ({ formData, setFormData, roles }: Props) => {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* LEFT */}

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="
            rounded-xl
            bg-indigo-100
            p-3
          "
          >
            <Target
              className="
              h-5
              w-5
              text-indigo-600
            "
            />
          </div>

          <div>
            <h2
              className="
              text-xl
              font-bold
              text-slate-900
            "
            >
              Career Direction
            </h2>

            <p
              className="
              text-sm
              text-slate-500
            "
            >
              Help us understand your career goals.
            </p>
          </div>
        </div>

        <div
          className="
          rounded-2xl
          border
          bg-slate-50
          p-5
        "
        >
          <div className="flex gap-3">
            <Sparkles
              className="
              mt-0.5
              h-5
              w-5
              text-indigo-500
              shrink-0
            "
            />

            <div
              className="
              space-y-2
              text-sm
              text-slate-600
            "
            >
              <p className="font-semibold">Choose your target role carefully</p>

              <p>
                We use your target role to match you with interview partners and mentors who fit
                your career direction.
              </p>

              <ul
                className="
                list-disc
                pl-5
                text-slate-500
              "
              >
                <li>Better peer matching</li>

                <li>More relevant mentoring</li>

                <li>Personalized roadmap</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}

      <div
        className="
        flex
        items-center
      "
      >
        <div className="w-full space-y-3">
          <Label
            className="
            text-xs
            uppercase
            font-bold
            tracking-wide
            text-slate-500
          "
          >
            Target Role
          </Label>

          <Select
            value={formData.targetRoleId?.toString() ?? ''}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,

                targetRoleId: Number(value),
              }))
            }
          >
            <SelectTrigger
              className="
              bg-white
              border-slate-200
              h-12
              "
            >
              <SelectValue placeholder="Choose target role" />
            </SelectTrigger>

            <SelectContent
              className="
              bg-white
              border
              shadow-xl
              z-[100]
              "
            >
              {roles.map((role) => (
                <SelectItem
                  key={role.id}
                  value={role.id.toString()}
                  className="
                  cursor-pointer
                  "
                >
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
