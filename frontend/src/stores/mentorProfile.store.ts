import { create } from 'zustand';

type MentorProfileState = {
  profile: {
    name: string;
    bio: string;
    headline: string;
    avatarUrl: string;
    linkedInLink: string;
    githubLink: string;
    introductionVideoUrl: string;
  };

  experiences: Array<{
    id?: number;
    companyId: number;
    jobRoleId: number;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    proofUrl?: string;
    description?: string;
  }>;

  skills: Array<{
    id?: number;
    skillId: number;
    type: string;
    experienceMonths: number;
    proofUrl?: string;
    level: string;
  }>;

  coachingPlans: Array<{
    id?: number;
    title: string;
    description: string;
    duration: number;
    price: number;
    categoryId: number;
    questions?: Array<{
      id?: number;
      question: string;
      type: string; // 'TEXT' hoặc 'FILE'
      isRequired?: boolean;
    }>;
  }>;

  setProfileField: (field: string, value: string) => void;

  addExperience: () => void;

  updateExperience: (index: number, data: Partial<MentorProfileState['experiences'][0]>) => void;

  removeExperience: (index: number) => void;

  addSkill: () => void;

  updateSkill: (index: number, data: Partial<MentorProfileState['skills'][0]>) => void;

  removeSkill: (index: number) => void;

  addCoachingPlan: () => void;

  updateCoachingPlan: (
    index: number,
    data: Partial<MentorProfileState['coachingPlans'][0]>,
  ) => void;

  removeCoachingPlan: (index: number) => void;

  setAllData: (data: Partial<MentorProfileState>) => void;
};

export const useMentorProfileStore = create<MentorProfileState>((set) => ({
  profile: {
    name: '',
    bio: '',
    headline: '',
    avatarUrl: '',
    linkedInLink: '',
    githubLink: '',
    introductionVideoUrl: '',
  },

  experiences: [],

  skills: [],

  coachingPlans: [],

  setProfileField: (field, value) =>
    set((state) => ({
      profile: {
        ...state.profile,
        [field]: value,
      },
    })),

  addExperience: () =>
    set((state) => ({
      experiences: [
        ...state.experiences,
        {
          companyId: 0,
          jobRoleId: 0,
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
        },
      ],
    })),

  updateExperience: (index: number, updatedFields: Partial<any>) =>
    set((state) => {
      const newExperiences = [...state.experiences];
      newExperiences[index] = {
        ...newExperiences[index], // Giữ lại các field cũ
        ...updatedFields, // Đè các field mới (startDate, companyId...) lên
      };
      return { experiences: newExperiences };
    }),

  removeExperience: (index) =>
    set((state) => ({
      experiences: state.experiences.filter((_, currentIndex) => currentIndex !== index),
    })),

  addSkill: () =>
    set((state) => ({
      skills: [
        ...state.skills,
        {
          skillId: 0,
          type: 'HARDSKILL',
          experienceMonths: 0,
          level: 'LEARNING',
        },
      ],
    })),

  updateSkill: (index, data) =>
    set((state) => ({
      skills: state.skills.map((skill, currentIndex) =>
        currentIndex === index
          ? {
              ...skill,
              ...data,
            }
          : skill,
      ),
    })),

  removeSkill: (index) =>
    set((state) => ({
      skills: state.skills.filter((_, currentIndex) => currentIndex !== index),
    })),

  addCoachingPlan: () =>
    set((state) => ({
      coachingPlans: [
        ...state.coachingPlans,
        {
          title: '',
          description: '',
          duration: 60,
          price: 0,
          categoryId: 0,
          questions: [],
        },
      ],
    })),

  updateCoachingPlan: (index, data) =>
    set((state) => ({
      coachingPlans: state.coachingPlans.map((plan, currentIndex) =>
        currentIndex === index
          ? {
              ...plan,
              ...data,
            }
          : plan,
      ),
    })),

  removeCoachingPlan: (index) =>
    set((state) => ({
      coachingPlans: state.coachingPlans.filter((_, currentIndex) => currentIndex !== index),
    })),

  setAllData: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),
}));
