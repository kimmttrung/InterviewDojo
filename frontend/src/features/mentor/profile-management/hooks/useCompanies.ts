// frontend/src/features/mentor/profile-management/hooks/useCompanies.ts

import { useQuery } from '@tanstack/react-query';

import { mentorProfileService } from '../services/mentorProfile.service';

export const useCompanies = () => {
  return useQuery({
    queryKey: ['mentor-profile', 'companies'],
    queryFn: mentorProfileService.getCompanies,
  });
};

// Hook lấy 1 công ty theo ID (Dùng khi chỉ muốn hiển thị tên công ty)
export const useCompany = (id?: number) => {
  return useQuery({
    queryKey: ['mentor-profile', 'company', id],
    queryFn: () => mentorProfileService.getCompany(id as number),
    enabled: !!id, // Quan trọng: Chỉ gọi API khi truyền ID hợp lệ (khác undefined, khác 0)
    staleTime: 5 * 60 * 1000, // Cache lại 5 phút để tránh gọi API liên tục
  });
};
