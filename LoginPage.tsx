import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types/user';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      console.error('로그인 오류:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.svg"
            alt="교보문고 핫트랙스"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            송도점 재고관리 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정 정보로 로그인하세요
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-kyobo focus:border-kyobo focus:z-10 sm:text-sm"
                placeholder="이메일"
                {...register('email', { 
                  required: '이메일을 입력해주세요',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '유효한 이메일 주소를 입력해주세요',
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-kyobo focus:border-kyobo focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                {...register('password', { required: '비밀번호를 입력해주세요' })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              테스트 계정: admin@kyobobook.com / admin123
            </p>
            <p className="text-gray-600">
              직원 계정: staff@kyobobook.com / staff123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
