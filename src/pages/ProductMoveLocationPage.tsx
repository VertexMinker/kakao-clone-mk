import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService.frontend';
import { offlineService } from '../../services/offlineSync.frontend.service';
import { useAuth } from '../hooks/useAuth';
import { useSyncOffline } from '../hooks/useSyncOffline';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

const ProductMoveLocationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useSyncOffline();
  const queryClient = useQueryClient();

  const [toLocation, setToLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  const moveMutation = useMutation({
    mutationFn: (data: { productId: string; toLocation: string }) =>
      productService.moveLocation(data.productId, {
        toLocation: data.toLocation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({
        title: '위치 변경 완료',
        description: '제품 위치가 성공적으로 변경되었습니다.',
      });
      navigate(`/products/${id}`);
    },
    onError: (error) => {
      console.error('위치 변경 오류:', error);
      toast({
        title: '위치 변경 실패',
        description: '제품 위치를 변경하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !toLocation) return;
    if (product && product.location === toLocation) {
      toast({
        title: '위치 변경 실패',
        description: '현재 위치와 동일합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    if (isOnline) {
      // 온라인 모드: 직접 API 호출
      moveMutation.mutate({ productId: id, toLocation });
    } else {
      // 오프라인 모드: IndexedDB에 저장
      try {
        await offlineService.queueLocationMove(id, toLocation);
        toast({
          title: '위치 변경 예약됨',
          description:
            '오프라인 상태입니다. 온라인 연결 시 자동으로 동기화됩니다.',
        });
        navigate(`/products/${id}`);
      } catch (error) {
        console.error('오프라인 위치 변경 오류:', error);
        toast({
          title: '위치 변경 실패',
          description: '오프라인 작업을 저장하는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kyobo"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              제품 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/products/${id}`)}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">위치 변경</h1>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">{product.name}</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            SKU: {product.sku}
          </p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="currentLocation"
                className="block text-sm font-medium text-gray-700"
              >
                현재 위치
              </label>
              <input
                type="text"
                id="currentLocation"
                value={product.location}
                disabled
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm text-gray-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="toLocation"
                className="block text-sm font-medium text-gray-700"
              >
                새 위치
              </label>
              <input
                type="text"
                id="toLocation"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                required
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
                placeholder="예: 매장 A-1, 창고 B-2"
              />
            </div>

            {!isOnline && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      오프라인 모드
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        현재 오프라인 상태입니다. 위치 변경 작업은 저장되며,
                        온라인 연결 시 자동으로 동기화됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/products/${id}`)}
                className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !toLocation || product.location === toLocation
                }
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? '처리 중...' : '위치 변경'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductMoveLocationPage;
