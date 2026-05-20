import { useMutation } from '@tanstack/react-query';

export const useCancelSession = () => {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      console.log('Cancel session:', sessionId);

      return true;
    },
  });
};
