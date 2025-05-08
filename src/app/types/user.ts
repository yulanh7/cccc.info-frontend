import { ApiResponseProps } from './api';

export interface UserProps {
  id: number;
  email: string;
  username: string;
}

export interface AuthUserProps extends UserProps {
  token: string;
}

export type AuthResponse = ApiResponseProps<AuthUserProps>;