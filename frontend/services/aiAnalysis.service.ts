import { api } from '../lib/api';
import { API_ENPOINT } from '../lib/endpoints';

export const aiAnalysisService = {
  getSoloRecording: (recordingId: number | string) => {
    return api.get(API_ENPOINT.AI_ANALYSIS.GET_SOLO_RECORDING(recordingId));
  },
};
