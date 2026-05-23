import { AvatarUpload } from '@/shared/components/ui/avatar-upload';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

type FormData = {
  name: string;
  bio: string;
  linkedInLink: string;
  githubLink: string;
  targetRoleId: number | null;
  experienceYears: number;
};

type TargetRole = {
  id: number;
  name: string;
};

type ProfileBasicInfoProps = {
  formData: FormData;

  roles: TargetRole[];

  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
};

export const ProfileBasicInfo = ({ formData, setFormData }: ProfileBasicInfoProps) => {
  return (
    <div className="space-y-8">
      <div className="border-b pb-5">
        <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>

        <p className="mt-1 text-sm text-slate-500">
          Update your profile information and career direction.
        </p>
      </div>

      {/* Avatar */}

      <div className="flex justify-center">
        <AvatarUpload size="lg" />
      </div>

      {/* Name + Experience */}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Full Name
          </Label>

          <Input
            value={formData.name}
            placeholder="Enter full name"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(
                (prev: FormData): FormData => ({
                  ...prev,
                  name: event.target.value,
                }),
              )
            }
            className="border-slate-200 bg-slate-50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Experience Years
          </Label>

          <Input
            type="number"
            min={0}
            value={formData.experienceYears}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(
                (prev: FormData): FormData => ({
                  ...prev,
                  experienceYears: Number(event.target.value) || 0,
                }),
              )
            }
            className="border-slate-200 bg-slate-50"
          />
        </div>
      </div>

      {/* Social */}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">GitHub</Label>

          <Input
            placeholder="https://github.com/..."
            value={formData.githubLink}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(
                (prev: FormData): FormData => ({
                  ...prev,
                  githubLink: event.target.value,
                }),
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            LinkedIn
          </Label>

          <Input
            placeholder="https://linkedin.com/in/..."
            value={formData.linkedInLink}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(
                (prev: FormData): FormData => ({
                  ...prev,
                  linkedInLink: event.target.value,
                }),
              )
            }
          />
        </div>
      </div>

      {/* Bio */}

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Bio</Label>

        <Textarea
          rows={5}
          value={formData.bio}
          placeholder="Tell others about your experience..."
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(
              (prev: FormData): FormData => ({
                ...prev,
                bio: event.target.value,
              }),
            )
          }
          className="resize-none border-slate-200 bg-slate-50"
        />
      </div>
    </div>
  );
};
