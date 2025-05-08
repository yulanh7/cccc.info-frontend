import { ApiResponseProps } from './api';

export interface UserProps {
  id: number;
  email: string;
  firstName: string;
  admin: boolean;
}

export interface AuthResponseData extends UserProps {
  access_token: string;
  refresh_token: string;
}

export type AuthResponse = ApiResponseProps<AuthResponseData>;