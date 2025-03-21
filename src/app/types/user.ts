import { ApiResponse } from './api';

export interface User {
  id: number;
  email: string;
  first_name: string;
}

export type LoginResponse = ApiResponse<User>;

export type SignupResponse = ApiResponse<User>;

export type CurrentUserResponse = ApiResponse<User>;