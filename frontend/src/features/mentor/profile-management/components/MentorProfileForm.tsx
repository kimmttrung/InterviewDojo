// frontend/src/features/mentor/profile-management/components/MentorProfileForm.tsx

import { useRef, useState } from 'react';

import { Camera, Loader2, Video } from 'lucide-react';

import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

import { useUploadAvatar } from '@/hooks/mutations/useUploadAvatar';

import { mentorProfileService } from '../services/mentorProfile.service';

import { useMentorProfileStore } from '@/stores/mentorProfile.store';

export const MentorProfileForm = () => {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const uploadAvatarMutation = useUploadAvatar();
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const { profile, setProfileField } = useMentorProfileStore();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const updatedUser = await uploadAvatarMutation.mutateAsync(file);

      setProfileField('avatarUrl', updatedUser.avatarUrl);
    } catch (error) {
      console.error(error);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploadingVideo(true);

      // clear old preview immediately
      setProfileField('introductionVideoUrl', '');

      const uploadedVideo = await mentorProfileService.uploadIntroductionVideo(file);

      setProfileField('introductionVideoUrl', uploadedVideo.videoUrl);

      // reset input
      event.target.value = '';
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 border-b pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>

        <p className="mt-2 text-sm text-slate-500">
          Update your public mentor profile information.
        </p>
      </div>

      <div className="space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={profile.avatarUrl} />

              <AvatarFallback className="bg-slate-100 text-3xl font-bold text-slate-500">
                {profile.name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800"
            >
              {uploadAvatarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="mt-4 space-y-1">
            <h3 className="text-xl font-bold text-slate-900">{profile.name || 'Your Name'}</h3>

            <p className="text-sm text-slate-500">
              {profile.headline || 'Your professional headline'}
            </p>
          </div>
        </div>

        {/* Name + Headline */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Full Name
            </Label>

            <Input
              placeholder="e.g. John Doe"
              value={profile.name}
              onChange={(event) => setProfileField('name', event.target.value)}
              className="border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Headline
            </Label>

            <Input
              placeholder="e.g. Senior Backend Engineer @ Google"
              value={profile.headline}
              onChange={(event) => setProfileField('headline', event.target.value)}
              className="border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Bio</Label>

          <Textarea
            rows={5}
            placeholder="Tell candidates about your experience, mentoring style, and expertise..."
            value={profile.bio}
            onChange={(event) => setProfileField('bio', event.target.value)}
            className="border-slate-200 bg-slate-50"
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              LinkedIn
            </Label>

            <Input
              placeholder="https://linkedin.com/in/yourprofile"
              value={profile.linkedInLink}
              onChange={(event) => setProfileField('linkedInLink', event.target.value)}
              className="border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              GitHub
            </Label>

            <Input
              placeholder="https://github.com/yourusername"
              value={profile.githubLink}
              onChange={(event) => setProfileField('githubLink', event.target.value)}
              className="border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        {/* Introduction Video */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <Video className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Introduction Video</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Upload a short introduction video to build trust with candidates.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />

                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingVideo}
                  onClick={() => videoInputRef.current?.click()}
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Video'
                  )}
                </Button>

                {isUploadingVideo && (
                  <div className="flex h-[250px] items-center justify-center rounded-2xl border bg-slate-100">
                    {/* <div className="flex items-center gap-3 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading video...
                    </div> */}
                  </div>
                )}
              </div>
            </div>

            {profile.introductionVideoUrl && (
              <div className="overflow-hidden rounded-2xl border bg-black shadow-md">
                <video controls className="max-h-[400px] w-full" src={profile.introductionVideoUrl}>
                  <track kind="captions" />
                </video>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
