import apiClient from './authService';
import { Product, ProductFilter, ProductFormData, AdjustmentFormData, LocationMoveFormData, LocationHistory, InventoryAdjustment } from '../types/product';

export const productService = {
  // 제품 목록 조회
  async getProducts(filters: ProductFilter = {}): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.location) params.append('location', filters.location);
      if (filters.lowStock) params.append('lowStock', 'true');
      
      const response = await apiClient.get<{ data: Product[] }>('/products', { params });
      return response.data.data;
    } catch (error) {
      console.error('제품 목록 조회 오류:', error);
      throw error;
    }
  },
  
  // 제품 상세 조회
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await apiClient.get<{ data: Product }>(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('제품 상세 조회 오류:', error);
      throw error;
    }
  },
  
  // 제품 생성
  async createProduct(data: ProductFormData): Promise<Product> {
    try {
      const response = await apiClient.post<{ data: Product }>('/products', data);
      return response.data.data;
    } catch (error) {
      console.error('제품 생성 오류:', error);
      throw error;
    }
  },
  
  // 제품 수정
  async updateProduct(id: string, data: ProductFormData): Promise<Product> {
    try {
      const response = await apiClient.put<{ data: Product }>(`/products/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('제품 수정 오류:', error);
      throw error;
    }
  },
  
  // 제품 삭제
  async deleteProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      console.error('제품 삭제 오류:', error);
      throw error;
    }
  },
  
  // 재고 조정
  async adjustInventory(id: string, data: AdjustmentFormData): Promise<{ product: Product; adjustment: InventoryAdjustment }> {
    try {
      const response = await apiClient.post<{ data: { product: Product; adjustment: InventoryAdjustment } }>(`/products/${id}/adjust`, data);
      return response.data.data;
    } catch (error) {
      console.error('재고 조정 오류:', error);
      throw error;
    }
  },
  
  // 위치 변경
  async moveLocation(id: string, data: LocationMoveFormData): Promise<{ product: Product; locationHistory: LocationHistory }> {
    try {
      const response = await apiClient.post<{ data: { product: Product; locationHistory: LocationHistory } }>(`/products/${id}/move`, data);
      return response.data.data;
    } catch (error) {
      console.error('위치 변경 오류:', error);
      throw error;
    }
  },
  
  // 위치 이력 조회
  async getLocationHistory(id: string): Promise<LocationHistory[]> {
    try {
      const response = await apiClient.get<{ data: LocationHistory[] }>(`/products/${id}/location-history`);
      return response.data.data;
    } catch (error) {
      console.error('위치 이력 조회 오류:', error);
      throw error;
    }
  },
  
  // CSV 내보내기
  getExportUrl(filters: ProductFilter = {}): string {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.location) params.append('location', filters.location);
    if (filters.lowStock) params.append('lowStock', 'true');
    
    return `${apiClient.defaults.baseURL}/products/export?${params.toString()}`;
  },
  
  // 대량 업로드
  async bulkUpload(file: File): Promise<{ successCount: number; errorCount: number; errors?: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<{ data: { successCount: number; errorCount: number; errors?: string[] } }>('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('대량 업로드 오류:', error);
      throw error;
    }
  },
};
