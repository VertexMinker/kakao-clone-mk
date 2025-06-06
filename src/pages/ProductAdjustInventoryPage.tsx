import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService.frontend';
import { offlineService } from '../../services/offlineSync.frontend.service';
import { useAuth } from '../hooks/useAuth';
import { useSyncOffline } from '../hooks/useSyncOffline';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Save, AlertTriangle, Plus, Minus } from 'lucide-react';

const ProductAdjustInventoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useSyncOffline();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState<number>(0);
  const [memo, setMemo] = useState('');
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

  const adjustMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number; memo: string }) =>
      productService.adjustInventory(data.productId, {
        quantity: data.quantity,
        memo: data.memo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({
        title: '재고 조정 완료',
        description: '제품 재고가 성공적으로 조정되었습니다.',
      });
      navigate(`/products/${id}`);
    },
    onError: (error) => {
      console.error('재고 조정 오류:', error);
      toast({
        title: '재고 조정 실패',
        description: '제품 재고를 조정하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || quantity === 0) return;

    setIsSubmitting(true);

    if (isOnline) {
      // 온라인 모드: 직접 API 호출
      adjustMutation.mutate({ productId: id, quantity, memo });
    } else {
      // 오프라인 모드: IndexedDB에 저장
      try {
        await offlineService.queueInventoryAdjustment(id, quantity, memo);
        toast({
          title: '재고 조정 예약됨',
          description:
            '오프라인 상태입니다. 온라인 연결 시 자동으로 동기화됩니다.',
        });
        navigate(`/products/${id}`);
      } catch (error) {
        console.error('오프라인 재고 조정 오류:', error);
        toast({
          title: '재고 조정 실패',
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
        <h1 className="text-2xl font-bold text-gray-900">재고 조정</h1>
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
                htmlFor="currentQuantity"
                className="block text-sm font-medium text-gray-700"
              >
                현재 재고
              </label>
              <input
                type="text"
                id="currentQuantity"
                value={product.quantity}
                disabled
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm text-gray-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="adjustmentType"
                className="block text-sm font-medium text-gray-700"
              >
                조정 유형
              </label>
              <div className="mt-1 flex space-x-4">
                <div className="flex items-center">
                  <input
                    id="adjustmentTypeIn"
                    name="adjustmentType"
                    type="radio"
                    checked={quantity > 0}
                    onChange={() => setQuantity(Math.abs(quantity) || 1)}
                    className="h-4 w-4 text-kyobo focus:ring-kyobo border-gray-300"
                  />
                  <label
                    htmlFor="adjustmentTypeIn"
                    className="ml-2 block text-sm text-gray-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1 text-green-500" />
                    입고
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="adjustmentTypeOut"
                    name="adjustmentType"
                    type="radio"
                    checked={quantity < 0}
                    onChange={() =>
                      setQuantity(quantity === 0 ? -1 : -Math.abs(quantity))
                    }
                    className="h-4 w-4 text-kyobo focus:ring-kyobo border-gray-300"
                  />
                  <label
                    htmlFor="adjustmentTypeOut"
                    className="ml-2 block text-sm text-gray-700 flex items-center"
                  >
                    <Minus className="h-4 w-4 mr-1 text-red-500" />
                    출고
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                수량
              </label>
              <input
                type="number"
                id="quantity"
                value={Math.abs(quantity)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setQuantity(quantity < 0 ? -value : value);
                }}
                min="1"
                required
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="memo"
                className="block text-sm font-medium text-gray-700"
              >
                메모
              </label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
                placeholder="조정 사유 또는 참고 사항"
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
                        현재 오프라인 상태입니다. 재고 조정 작업은 저장되며,
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
                disabled={isSubmitting || quantity === 0}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? '처리 중...' : '재고 조정'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductAdjustInventoryPage;
