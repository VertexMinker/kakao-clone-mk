import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { LocationHistory } from '../types/product';
import { useAuth } from '../hooks/useAuth';
import { Edit, Trash, ArrowLeftRight, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id
  });
  
  const handleViewLocationHistory = async () => {
    if (!id) return;
    
    try {
      const history = await productService.getLocationHistory(id);
      setLocationHistory(history);
      setShowLocationHistory(true);
    } catch (error) {
      console.error('위치 이력 조회 오류:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!id || !isAdmin) return;
    
    if (window.confirm('정말로 이 제품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await productService.deleteProduct(id);
        navigate('/products');
      } catch (error) {
        console.error('제품 삭제 오류:', error);
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
          onClick={() => navigate('/products')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">제품 상세</h1>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{product.name}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate(`/products/${id}/edit`)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  삭제
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/products/${id}/adjust`)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              입/출고
            </button>
            <button
              onClick={() => navigate(`/products/${id}/move`)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              위치변경
            </button>
            <button
              onClick={handleViewLocationHistory}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo"
            >
              <Clock className="h-4 w-4 mr-1" />
              위치이력
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">카테고리</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{product.category}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">브랜드</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{product.brand}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">현재 위치</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{product.location}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">재고 수량</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.quantity <= product.safetyStock
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {product.quantity} / {product.safetyStock} (안전재고)
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">단가</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{product.price.toLocaleString()}원</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">최종 수정일</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(product.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* 위치 이력 모달 */}
      {showLocationHistory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">위치 이력</h3>
              <button
                onClick={() => setShowLocationHistory(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">닫기</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-5 sm:p-6 overflow-y-auto max-h-[60vh]">
              {locationHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">위치 이력이 없습니다.</p>
              ) : (
                <ul className="space-y-4">
                  {locationHistory.map((history) => (
                    <li key={history.id} className="border-l-2 border-kyobo pl-4 py-2">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {history.fromLocation} → {history.toLocation}
                          </p>
                          <p className="text-xs text-gray-500">
                            담당자: {history.user?.name || '알 수 없음'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(history.movedAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowLocationHistory(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-kyobo text-base font-medium text-white hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo sm:ml-3 sm:w-auto sm:text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
