import { api } from '@/shared/lib/api';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

import {
  mapAISummary,
  mapAnalyticsOverview,
  mapInterestedCategories,
  mapUpcomingSessions,
} from '../mappers/dashboard.mapper';

import type {
  AISummary,
  AnalyticsOverviewData,
  InterestedCategory,
  UpcomingSession,
} from '../dashboard.type';

// =====================================================
// ANALYTICS OVERVIEW
// =====================================================

export const getAnalyticsOverview = async (userId: number): Promise<AnalyticsOverviewData> => {
  const response = await api.get(`${API_ENDPOINT.CANDIDATE_DASHBOARD.GET_ANALYTICS}/${userId}`);

  return mapAnalyticsOverview(response.data.data);
};

// =====================================================
// AI SUMMARY
// =====================================================

export const getAISummary = async (userId: number): Promise<AISummary> => {
  const response = await api.get(`${API_ENDPOINT.CANDIDATE_DASHBOARD.GET_AI_SUMMARY}/${userId}`);

  return mapAISummary(response.data.data);
};

// =====================================================
// UPCOMING SESSIONS
// =====================================================

export const getUpcomingSessions = async (userId: number): Promise<UpcomingSession[]> => {
  const response = await api.get(
    `${API_ENDPOINT.CANDIDATE_DASHBOARD.GET_UPCOMING_SESSIONS}/${userId}`,
  );

  return mapUpcomingSessions(response.data.data);
};

// =====================================================
// INTERESTED CATEGORIES
// =====================================================

export const getInterestedCategories = async (userId: number): Promise<InterestedCategory[]> => {
  const response = await api.get(
    `${API_ENDPOINT.CANDIDATE_DASHBOARD.GET_INTERESTED_CATEGORIES}/${userId}`,
  );

  return mapInterestedCategories(response.data.data);
};
