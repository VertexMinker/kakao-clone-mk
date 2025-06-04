import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '@zxing/browser';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Camera, QrCode, AlertTriangle } from 'lucide-react';

const BarcodeScannerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [scanner, setScanner] = useState<BarcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // 카메라 장치 목록 가져오기
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoDevs);
        
        if (videoDevs.length > 0) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (error) {
        console.error('카메라 장치 목록 가져오기 오류:', error);
        setPermissionDenied(true);
      }
    };
    
    getDevices();
  }, []);

  // 스캐너 초기화
  useEffect(() => {
    if (!selectedDeviceId) return;
    
    const initScanner = async () => {
      try {
        const newScanner = new BarcodeScanner();
        setScanner(newScanner);
      } catch (error) {
        console.error('스캐너 초기화 오류:', error);
        toast({
          title: '스캐너 초기화 실패',
          description: '바코드 스캐너를 초기화하는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    };
    
    initScanner();
    
    return () => {
      if (scanner) {
        scanner.stop();
      }
    };
  }, [selectedDeviceId, toast]);

  // 스캔 시작
  const startScanning = async () => {
    if (!scanner || !selectedDeviceId) return;
    
    try {
      setScanning(true);
      
      const videoElement = document.getElementById('scanner-preview') as HTMLVideoElement;
      if (!videoElement) return;
      
      await scanner.start(
        { deviceId: { exact: selectedDeviceId } },
        videoElement,
        result => handleScanResult(result.getText())
      );
    } catch (error) {
      console.error('스캔 시작 오류:', error);
      setScanning(false);
      toast({
        title: '스캔 시작 실패',
        description: '카메라 접근 권한이 없거나 장치를 사용할 수 없습니다.',
        variant: 'destructive',
      });
      setPermissionDenied(true);
    }
  };

  // 스캔 중지
  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      setScanning(false);
    }
  };

  // 스캔 결과 처리
  const handleScanResult = (code: string) => {
    stopScanning();
    
    // SKU 형식 검증 (예: 알파벳+숫자 조합)
    const isValidSku = /^[A-Za-z0-9-]+$/.test(code);
    
    if (isValidSku) {
      toast({
        title: '바코드 스캔 성공',
        description: `SKU: ${code}`,
      });
      
      // 제품 검색 페이지로 이동
      navigate(`/products?search=${code}`);
    } else {
      toast({
        title: '유효하지 않은 바코드',
        description: '인식된 바코드가 유효한 SKU 형식이 아닙니다.',
        variant: 'destructive',
      });
      
      // 스캔 재시작
      startScanning();
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">바코드/QR 스캔</h1>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div className="flex items-center">
            <QrCode className="h-5 w-5 mr-2 text-kyobo" />
            <h2 className="text-lg font-medium text-gray-900">스캐너</h2>
          </div>
          
          {videoDevices.length > 0 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                stopScanning();
                setSelectedDeviceId(e.target.value);
              }}
              className="block w-48 pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-kyobo focus:border-kyobo"
              disabled={scanning}
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `카메라 ${videoDevices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-4">
          {permissionDenied ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">카메라 접근 권한 없음</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      브라우저 설정에서 카메라 접근 권한을 허용해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : videoDevices.length === 0 ? (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">카메라를 찾을 수 없음</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      사용 가능한 카메라가 없습니다. 카메라가 연결되어 있는지 확인해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  id="scanner-preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <Camera className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                {!scanning ? (
                  <button
                    onClick={startScanning}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    스캔 시작
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    스캔 중지
                  </button>
                )}
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>제품의 바코드 또는 QR 코드를 카메라에 비춰주세요.</p>
                <p>코드가 인식되면 자동으로 해당 제품 페이지로 이동합니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerPage;
