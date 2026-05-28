export const sepayConfig = {
  // SePay API endpoints (sandbox vs production)
  baseUrl: process.env.SEPAY_API_URL || 'https://my.sepay.vn/api',
  apiKey: process.env.SEPAY_API_KEY!,
  webhookSecret: process.env.SEPAY_WEBHOOK_SECRET!,
  bankCode: process.env.BANK_CODE!,
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER!,
};
