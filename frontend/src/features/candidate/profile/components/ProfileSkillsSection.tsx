import { SkillTable } from '@/features/shared-domain/skill/components/SkillTable';

import { useCandidateProfileStore } from '@/stores/userProfile.store';

export const ProfileSkillsSection = () => {
  const { skills, addSkill, updateSkill, removeSkill } = useCandidateProfileStore();

  return (
    <SkillTable
      skills={skills}
      addSkill={addSkill}
      updateSkill={updateSkill}
      removeSkill={removeSkill}
    />
  );
};
