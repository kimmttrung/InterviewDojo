import { toast } from 'sonner';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: '#16a34a', // xanh
        color: 'white',
        border: 'none',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      style: {
        background: '#dc2626', // đỏ
        color: 'white',
        border: 'none',
      },
    });
  },

  warning: (message: string) => {
    toast(message, {
      style: {
        background: '#f59e0b',
        color: 'white',
      },
    });
  },
};
