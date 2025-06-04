import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  BarChart, 
  Settings,
  FileText
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="flex-1 py-6 px-4 space-y-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
                isActive 
                  ? 'bg-kyobo text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            대시보드
          </NavLink>

          <NavLink 
            to="/products" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
                isActive 
                  ? 'bg-kyobo text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Package className="mr-3 h-5 w-5" />
            제품 관리
          </NavLink>

          <NavLink 
            to="/reports" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
                isActive 
                  ? 'bg-kyobo text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <BarChart className="mr-3 h-5 w-5" />
            보고서
          </NavLink>

          {isAdmin && (
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
                  isActive 
                    ? 'bg-kyobo text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Settings className="mr-3 h-5 w-5" />
              설정
            </NavLink>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
            <FileText className="mr-3 h-5 w-5" />
            사용 설명서
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
