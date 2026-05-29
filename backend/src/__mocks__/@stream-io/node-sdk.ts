export const StreamClient = jest.fn().mockImplementation(() => ({
  generateUserToken: jest.fn().mockReturnValue('mock-token'),
  video: {
    call: jest.fn().mockReturnValue({
      getOrCreate: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));
