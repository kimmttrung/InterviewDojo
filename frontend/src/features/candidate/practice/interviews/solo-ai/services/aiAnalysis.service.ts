import { api } from '../../../../../../shared/lib/api';
import { API_ENDPOINT } from '../../../../../../shared/lib/endpoints';

export const aiAnalysisService = {
  getSoloRecording: (recordingId: number | string) => {
    return api.get(API_ENDPOINT.AI_ANALYSIS.GET_SOLO_RECORDING(recordingId));
  },
};
