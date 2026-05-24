import { useUserProfileModalStore } from '../stores/userProfileModalStore';

interface UserAvatarProps {
  userId: number;
  avatarUrl?: string | null;
  name?: string;
  className?: string;
}

export const UserAvatar = ({ userId, avatarUrl, name, className = '' }: UserAvatarProps) => {
  const openModal = useUserProfileModalStore((state) => state.openModal);
  return (
    <button
      onClick={() => openModal(userId)}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <img
        src={avatarUrl || '/default-avatar.png'}
        alt={name || 'Avatar'}
        className="h-full w-full rounded-full object-cover"
      />
    </button>
  );
};
