import { useEffect, useState } from 'react';
import { offlineService } from '../services/offlineService';
import apiClient from '../services/authService';
import { useToast } from '../components/ui/use-toast';

export const useSyncOffline = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // 온라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 오프라인 작업 동기화
  const syncOfflineActions = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      const pendingActions = await offlineService.getPendingActions();

      if (pendingActions.length === 0) {
        return;
      }

      // 서버에 동기화 요청
      const response = await apiClient.post('/sync', {
        actions: pendingActions.map(action => ({
          type: action.type,
          data: action.data,
          timestamp: action.timestamp
        }))
      });

      const { successCount, errorCount, results, errors } = response.data.data;

      // 성공한 작업 처리
      for (const result of results) {
        const action = pendingActions.find(a => a.type === result.type && a.data.productId === result.data.product.id);
        if (action && result.success) {
          await offlineService.markActionSynced(action.id);
        }
      }

      // 동기화된 작업 정리
      await offlineService.clearSyncedActions();

      // 결과 알림
      toast({
        title: '오프라인 작업 동기화 완료',
        description: `성공: ${successCount}건, 실패: ${errorCount}건`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      // 오류 로깅
      if (errors && errors.length > 0) {
        console.error('동기화 오류:', errors);
      }
    } catch (error) {
      console.error('동기화 실패:', error);
      toast({
        title: '동기화 실패',
        description: '오프라인 작업을 동기화하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 온라인 상태가 되면 자동 동기화
  useEffect(() => {
    if (isOnline) {
      syncOfflineActions();
    }
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    syncOfflineActions
  };
};
