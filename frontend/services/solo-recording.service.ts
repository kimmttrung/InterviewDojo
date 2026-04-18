import { api } from '../lib/api';

export const soloRecordingService = {
  uploadVideo: (formData: FormData) =>
    api.post('/solo-recordings/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadAudioAndAnalyze: (formData: FormData) =>
    api.post('/solo-recordings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateVideoUrl: (recordingId: number, videoUrl: string) =>
    api.patch(`/solo-recordings/${recordingId}/video`, { videoUrl }),
};
