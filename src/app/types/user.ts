import { ApiResponseProps } from './api';

export interface UserProps {
  id: number;
  email: string;
  first_name: string;
}

export type LoginResponse = ApiResponseProps<UserProps>;

export type SignupResponse = ApiResponseProps<UserProps>;

export type CurrentUserResponse = ApiResponseProps<UserProps>;