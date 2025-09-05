export interface LoginCredentials {
  email: string;
  password: string;
}

export type SignupCredentials = {
  email: string;
  firstName: string;
  password: string;
  clientHash?: boolean;
  recaptchaToken?: string | null;
};
