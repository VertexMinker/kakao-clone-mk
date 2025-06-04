import { User } from '../types/user';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  isOnline: boolean;
  onSync: () => Promise<void>;
}

const Navbar = ({ user, isOnline, onSync }: NavbarProps) => {
  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="교보문고 핫트랙스"
              className="h-8 w-auto mr-2"
            />
            <span className="text-lg font-semibold text-kyobo">
              송도점 재고관리
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* 온라인 상태 표시 */}
          <div className="flex items-center text-sm">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? '온라인' : '오프라인'}
            </span>
          </div>

          {/* 동기화 버튼 */}
          <button
            onClick={onSync}
            disabled={!isOnline}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="오프라인 작업 동기화"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>

          {/* 사용자 정보 */}
          <div className="flex items-center text-sm">
            <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="font-medium">
              {user?.name} ({user?.role === 'admin' ? '관리자' : '직원'})
            </span>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={logout}
            className="p-1.5 rounded-full hover:bg-gray-100"
            title="로그아웃"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
