export const HEADLESS = Boolean(Number(process.env.HEADLESS || 1));

export const CAPTCHA_SOLVER = String(process.env.CAPTCHA_SOLVER);
export const CAPTCHA_SOLVER_API_KEY = String(process.env.CAPTCHA_SOLVER_API_KEY);

export const CREDENTIALS = {
  username: String(process.env.ROLLBIT_USERNAME),
  password: String(process.env.ROLLBIT_PASSWORD),
  otpToken: String(process.env.ROLLBIT_OTP_TOKEN)
};