export type LoginCredentials = {
  email: string;
  password: string;
  clientHash?: boolean;
  recaptchaToken?: string | null;
};

export type SignupCredentials = {
  email: string;
  firstName: string;
  password: string;
  clientHash?: boolean;
  recaptchaToken?: string | null;
};
