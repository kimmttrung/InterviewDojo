// src/services/solo-recording.service.ts
import { api } from '../lib/api';

export const soloRecordingService = {
    upload: (formData: FormData) =>
        api.post('/solo-recordings/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    analyze: (id: string, formData: FormData) =>
        api.post(`/solo-recordings/${id}/analyze`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};