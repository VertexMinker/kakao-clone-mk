import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSyncOffline } from '../hooks/useSyncOffline';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user } = useAuth();
  const { isOnline, syncOfflineActions } = useSyncOffline();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={user} isOnline={isOnline} onSync={syncOfflineActions} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
