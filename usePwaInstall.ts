import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';

// PWA 설치 안내 훅
export const usePwaInstall = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // 브라우저 기본 설치 프롬프트 방지
      e.preventDefault();
      // 이벤트 저장
      deferredPrompt = e;
      
      // 사용자에게 설치 안내 토스트 표시
      toast({
        title: '앱 설치 가능',
        description: '재고관리 앱을 설치하면 오프라인에서도 사용할 수 있습니다.',
        action: (
          <button
            onClick={() => showInstallPrompt()}
            className="px-3 py-2 rounded-md bg-kyobo text-white text-xs"
          >
            설치하기
          </button>
        ),
      });
    };
    
    const showInstallPrompt = async () => {
      if (!deferredPrompt) return;
      
      // 설치 프롬프트 표시
      deferredPrompt.prompt();
      
      // 사용자 응답 대기
      const { outcome } = await deferredPrompt.userChoice;
      
      // 결과에 따른 처리
      if (outcome === 'accepted') {
        console.log('사용자가 PWA 설치를 수락했습니다.');
      } else {
        console.log('사용자가 PWA 설치를 거부했습니다.');
      }
      
      // deferredPrompt 초기화
      deferredPrompt = null;
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast, navigate]);
};

export default usePwaInstall;
