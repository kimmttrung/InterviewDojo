import { ApprovalStatus, SlotRecurrentType } from '@prisma/client';

import { BaseFeature } from './base-feature.interface';

export interface MentorFeature extends BaseFeature {
  bio: string;

  coachingPlans: string[];

  approvalStatus: ApprovalStatus;

  availableSlots: MentorAvailableSlot[];
}

export interface MentorAvailableSlot {
  startTime: Date;

  endTime: Date;

  recurrentType: SlotRecurrentType;

  recurrentUntil?: Date | null;

  isActive: boolean;
}
