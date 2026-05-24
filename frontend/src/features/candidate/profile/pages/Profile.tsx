'use client';

import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Layout } from '@/shared/components/layout/Layout';
import { Card } from '@/shared/components/ui/card';

import { ProfileBasicInfo } from '../components/ProfileBasicInfo';
import { ProfileCareerSection } from '../components/ProfileCareerSection';
import { ProfileSkillsSection } from '../components/ProfileSkillsSection';
import { UpdateProfileButton } from '../components/UpdateProfileButton';

import { useProfile } from '../hooks/useProfile';
import { useTargetRoles } from '../hooks/useTargetRoles';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

import { useCandidateProfileStore } from '@/stores/userProfile.store';

type ProfileFormData = {
  name: string;
  bio: string;
  targetRoleId: number | null;
  experienceYears: number;
  linkedInLink: string;
  githubLink: string;
};

type UserSkillResponse = {
  skillId: number;
  name: string;
  type: 'HARDSKILL' | 'SOFTSKILL' | 'LANGUAGE';
  level: 'AWARENESS' | 'FOUNDATION' | 'AUTONOMOUS' | 'FLUENT' | 'LEADERSHIP';
  experienceMonths: number;
  proofUrl?: string;
};

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();

  const { data: targetRoles = [] } = useTargetRoles();

  const updateProfileMutation = useUpdateProfile();

  const { skills, setAllData } = useCandidateProfileStore();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    targetRoleId: null,
    experienceYears: 0,
    linkedInLink: '',
    githubLink: '',
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormData({
      name: profile.name ?? '',
      bio: profile.bio ?? '',
      targetRoleId: profile.targetRoleId ?? null,
      experienceYears: profile.experienceYears ?? 0,
      linkedInLink: profile.linkedInLink ?? '',
      githubLink: profile.githubLink ?? '',
    });

    setAllData({
      skills:
        profile.skills?.map((skill: UserSkillResponse) => ({
          skillId: skill.skillId,

          type: skill.type,

          level: skill.level,

          experienceMonths: skill.experienceMonths,

          proofUrl: skill.proofUrl ?? '',
        })) ?? [],
    });
  }, [profile, setAllData]);

  const handleUpdateProfile = async () => {
    await updateProfileMutation.mutateAsync({
      name: formData.name,

      bio: formData.bio,

      targetRoleId: formData.targetRoleId,

      experienceYears: formData.experienceYears,

      linkedInLink: formData.linkedInLink,

      githubLink: formData.githubLink,

      skills: skills
        .filter((skill) => skill.skillId > 0)
        .map((skill) => ({
          skillId: skill.skillId,

          experienceMonths: skill.experienceMonths,

          level: skill.level,

          proofUrl: skill.proofUrl || undefined,
        })),
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div
          className="
          flex
          min-h-screen
          items-center
          justify-center
        "
        >
          <Loader2
            className="
            h-8
            w-8
            animate-spin
            text-slate-400
          "
          />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div
          className="
          flex
          min-h-screen
          items-center
          justify-center
          text-red-500
        "
        >
          Failed to load profile
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="
        min-h-screen
        bg-slate-50
        px-6
        py-8
      "
      >
        <div
          className="
          mx-auto
          max-w-6xl
          space-y-6
        "
        >
          <div>
            <h1
              className="
              text-3xl
              font-bold
              text-slate-900
            "
            >
              My Profile
            </h1>

            <p
              className="
              mt-1
              text-sm
              text-slate-500
            "
            >
              Keep your profile updated.
            </p>
          </div>

          <Card
            className="
            border-none
            bg-white
            p-8
            shadow-sm
          "
          >
            <ProfileBasicInfo formData={formData} setFormData={setFormData} roles={targetRoles} />
          </Card>

          <Card
            className="
            border-none
            bg-white
            p-8
            shadow-sm
          "
          >
            <ProfileCareerSection
              formData={formData}
              setFormData={setFormData}
              roles={targetRoles}
            />
          </Card>

          <ProfileSkillsSection />

          <div
            className="
            flex
            justify-end
          "
          >
            <UpdateProfileButton
              loading={updateProfileMutation.isPending}
              onUpdate={handleUpdateProfile}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
