import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../hooks/useAuth';
import { useSyncOffline } from '../hooks/useSyncOffline';
import {
  BarChart3,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../services/productService.frontend';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, syncOfflineActions } = useSyncOffline();

  // 오프라인 상태에서 온라인으로 전환 시 자동 동기화
  useEffect(() => {
    if (isOnline) {
      syncOfflineActions();
    }
  }, [isOnline, syncOfflineActions]);

  // 제품 데이터 조회
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', { lowStock: false }],
    queryFn: () => productService.getProducts(),
  });

  // 저재고 제품 조회
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['products', { lowStock: true }],
    queryFn: () => productService.getProducts({ lowStock: true }),
  });

  // 통계 계산
  const totalProducts = products.length;
  const totalStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const totalLowStock = lowStockProducts.length;
  const totalCategories = [...new Set(products.map((p) => p.category))].length;

  // 최근 입고/출고 제품 (실제로는 API에서 가져와야 함)
  const recentProducts = products.slice(0, 5);

  return (
    <>
      <Helmet>
        <title>대시보드 - 교보문고 핫트랙스 송도점 재고관리</title>
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            대시보드
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/scanner')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo"
            >
              바코드 스캔
            </button>
          </div>
        </div>

        {!isOnline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  현재 오프라인 상태입니다. 일부 기능이 제한될 수 있으며,
                  변경사항은 온라인 연결 시 자동으로 동기화됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 제품 수</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 재고량</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStock}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">저재고 제품</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalLowStock}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">카테고리</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalCategories}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 저재고 알림 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">저재고 알림</h3>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kyobo"></div>
              </div>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                저재고 상품이 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상품명
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        SKU
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        위치
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        재고/안전재고
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {product.quantity} / {product.safetyStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() =>
                              navigate(`/products/${product.id}/adjust`)
                            }
                            className="text-kyobo hover:text-kyobo-dark"
                          >
                            입고 처리
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lowStockProducts.length > 5 && (
                  <div className="px-6 py-3 text-center">
                    <button
                      onClick={() => navigate('/products?lowStock=true')}
                      className="text-sm text-kyobo hover:text-kyobo-dark"
                    >
                      모든 저재고 상품 보기 ({lowStockProducts.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">
              최근 추가된 제품
            </h3>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kyobo"></div>
              </div>
            ) : recentProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                최근 추가된 제품이 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상품명
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        SKU
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        카테고리
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        위치
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        재고
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <a
                            href={`/products/${product.id}`}
                            className="text-kyobo hover:underline"
                          >
                            {product.name}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-3 text-center">
                  <button
                    onClick={() => navigate('/products')}
                    className="text-sm text-kyobo hover:text-kyobo-dark"
                  >
                    모든 제품 보기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
