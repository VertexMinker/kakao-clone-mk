import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product, ProductFilter } from '../types/product';
import { Search, Filter, Plus, FileDown, FileUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ProductsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [filters, setFilters] = useState<ProductFilter>({
    search: '',
    category: '',
    brand: '',
    location: '',
    lowStock: false
  });
  
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters)
  });
  
  // 카테고리, 브랜드, 위치 목록 추출
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category))];
      const uniqueBrands = [...new Set(products.map(p => p.brand))];
      const uniqueLocations = [...new Set(products.map(p => p.location))];
      
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
      setLocations(uniqueLocations);
    }
  }, [products]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLowStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, lowStock: e.target.checked }));
  };
  
  const handleExport = () => {
    const exportUrl = productService.getExportUrl(filters);
    window.open(exportUrl, '_blank');
  };
  
  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">제품 관리</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FileDown className="h-4 w-4 mr-2" />
                CSV 내보내기
              </button>
              <Link
                to="/products/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileUp className="h-4 w-4 mr-2" />
                대량 업로드
              </Link>
              <Link
                to="/products/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo"
              >
                <Plus className="h-4 w-4 mr-2" />
                신규 제품
              </Link>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            검색 및 필터
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="상품명 또는 SKU 검색"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
              />
            </div>
            
            <div>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
              >
                <option value="">모든 카테고리</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
              >
                <option value="">모든 브랜드</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-kyobo focus:border-kyobo sm:text-sm"
              >
                <option value="">모든 위치</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                id="lowStock"
                name="lowStock"
                type="checkbox"
                checked={filters.lowStock}
                onChange={handleLowStockToggle}
                className="h-4 w-4 text-kyobo focus:ring-kyobo border-gray-300 rounded"
              />
              <label htmlFor="lowStock" className="ml-2 block text-sm text-gray-900">
                저재고 상품만 보기
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kyobo"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                제품 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상품명
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        카테고리
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        브랜드
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        위치
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수량
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        단가
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link to={`/products/${product.id}`} className="text-kyobo hover:underline">
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.brand}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.quantity <= product.safetyStock
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.quantity} / {product.safetyStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.price.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Link
                              to={`/products/${product.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              상세
                            </Link>
                            <Link
                              to={`/products/${product.id}/adjust`}
                              className="text-green-600 hover:text-green-900"
                            >
                              입/출고
                            </Link>
                            <Link
                              to={`/products/${product.id}/move`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              위치변경
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
