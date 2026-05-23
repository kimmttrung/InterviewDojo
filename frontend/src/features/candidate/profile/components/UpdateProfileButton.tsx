import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

type Props = {
  onUpdate: () => void;
  loading: boolean;
};

export const UpdateProfileButton = ({ onUpdate, loading }: Props) => {
  return (
    <Button
      onClick={onUpdate}
      disabled={loading}
      className="
      w-full
      md:w-auto
      bg-slate-900
      hover:bg-slate-800
      "
    >
      {loading && (
        <Loader2
          className="
          mr-2
          h-4
          w-4
          animate-spin
          "
        />
      )}
      Update Profile
    </Button>
  );
};
