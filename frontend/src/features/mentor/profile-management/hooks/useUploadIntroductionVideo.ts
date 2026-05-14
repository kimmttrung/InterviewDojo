import { useMutation } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

import { showToast } from '@/shared/lib/toast';

export const useUploadIntroductionVideo = () => {
  return useMutation({
    mutationFn: (file: File) => mentorProfileService.uploadIntroductionVideo(file),

    onSuccess: () => {
      showToast.success('Upload video thành công');
    },

    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Upload thất bại';

      showToast.error(msg);
    },
  });
};
