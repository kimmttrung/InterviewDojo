import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useCurrentUser } from '@/features/auth';
import { useUploadAvatar } from '@/hooks/mutations/useUploadAvatar';
import { showToast } from '@/shared/lib/toast';

interface AvatarUploadProps {
  size?: 'sm' | 'lg';
}

export function AvatarUpload({ size = 'lg' }: AvatarUploadProps) {
  const { data: user } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending } = useUploadAvatar();

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('File quá lớn, tối đa 5MB');
        return;
      }
      upload(file);
      e.target.value = ''; // reset để có thể chọn lại cùng file
    }
  };

  const sizeClasses = size === 'sm' ? 'h-12 w-12' : 'h-28 w-28';

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      <Avatar className={`${sizeClasses} ring-4 ring-slate-100 shadow-inner`}>
        <AvatarImage src={user?.avatarUrl || undefined} />
        <AvatarFallback className="bg-slate-200 text-slate-600 text-2xl font-bold">
          {user?.name?.substring(0, 2).toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-xs font-bold">Change</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
