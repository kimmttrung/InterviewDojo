// UserProfileModal.tsx (thêm typing và xử lý lỗi)
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useSessionStore } from '../../stores/useSessionStore';
import { API_ENDPOINT } from '@/shared/lib/endpoints';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  bio?: string | null;
  experienceYears?: number;
}

const fetchUserProfile = async (userId: number): Promise<UserProfile> => {
  const url = API_ENDPOINT.USER.GET_BY_ID.replace(':id', userId.toString());
  const response = await api.get(url);
  return response.data.data.data; // Lấy data bên trong
};

export const UserProfileModal = () => {
  const { profileModalUserId, closeProfileModal } = useSessionStore();
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: ['user', profileModalUserId],
    queryFn: () => fetchUserProfile(profileModalUserId!),
    enabled: !!profileModalUserId,
  });

  if (!profileModalUserId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Thông tin người dùng</h2>
          <button
            onClick={closeProfileModal}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {error && (
          <p className="text-center text-red-500">
            Lỗi khi tải thông tin: {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center text-center">
              <img
                src={user.avatarUrl || '/default-avatar.png'}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
              <h3 className="mt-4 text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-500">{user.email}</p>
              <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {user.role}
              </span>
            </div>

            <div className="space-y-3">
              {user.bio && (
                <div>
                  <h4 className="font-medium text-gray-700">Giới thiệu</h4>
                  <p className="text-gray-600">{user.bio}</p>
                </div>
              )}
              {user.experienceYears !== undefined && user.experienceYears > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700">Kinh nghiệm</h4>
                  <p className="text-gray-600">{user.experienceYears} năm</p>
                </div>
              )}
              {!user.bio && (!user.experienceYears || user.experienceYears === 0) && (
                <p className="text-gray-500 italic">Chưa cập nhật thông tin chi tiết</p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && !user && (
          <p className="text-center text-red-500">Không tìm thấy thông tin người dùng</p>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={closeProfileModal}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
