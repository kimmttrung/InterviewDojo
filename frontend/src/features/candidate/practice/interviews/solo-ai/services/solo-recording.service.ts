import { api } from '../../../../../../shared/lib/api';

export const soloRecordingService = {
  uploadVideo: (formData: FormData) =>
    api.post('/solo-recordings/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadAudioAndAnalyze: (payload: any) => api.post('/solo-recordings/upload', payload),

  updateVideoUrl: (recordingId: number, videoUrl: string, publicId: string) =>
    api.patch(`/solo-recordings/${recordingId}/video`, { videoUrl, publicId }),
};
