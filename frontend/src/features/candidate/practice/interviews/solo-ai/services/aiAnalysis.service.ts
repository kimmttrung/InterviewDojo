import { api } from '../../../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../../../shared/lib/endpoints';

export const aiAnalysisService = {
  getSoloRecording: (sessionId: number | string) => {
    return api.get(API_ENDPOINT.AI_ANALYSIS.GET_SOLO_RECORDING(sessionId));
  },
};
