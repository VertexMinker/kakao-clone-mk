import axios from 'axios';
import { AuthResponse, LoginCredentials, RefreshTokenResponse, User } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 토큰 관리
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// API 클라이언트 설정
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러이고, 토큰 갱신 시도가 아직 안 된 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('리프레시 토큰이 없습니다.');
        }
        
        const response = await axios.post<RefreshTokenResponse>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );
        
        const { accessToken } = response.data;
        setTokens(accessToken, refreshToken);
        
        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃
        clearTokens();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const { accessToken, refreshToken, user } = response.data;
      setTokens(accessToken, refreshToken);
      return user;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  },
  
  logout(): void {
    clearTokens();
  },
  
  async getCurrentUser(): Promise<User | null> {
    const token = getAccessToken();
    if (!token) return null;
    
    try {
      // JWT 디코딩 또는 사용자 정보 API 호출
      // 여기서는 간단히 로컬 스토리지에서 사용자 정보를 가져오는 것으로 대체
      const userJson = localStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      
      // 실제로는 사용자 정보 API를 호출해야 함
      // const response = await apiClient.get<User>('/auth/me');
      // return response.data;
      
      return null;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  },
};

export default apiClient;
