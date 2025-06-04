export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
