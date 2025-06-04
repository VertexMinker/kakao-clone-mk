export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  location: string;
  quantity: number;
  safetyStock: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  search?: string;
  category?: string;
  brand?: string;
  location?: string;
  lowStock?: boolean;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  memo?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface LocationHistory {
  id: string;
  productId: string;
  userId: string;
  fromLocation: string;
  toLocation: string;
  movedAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  brand: string;
  location: string;
  quantity: number;
  safetyStock: number;
  price: number;
}

export interface AdjustmentFormData {
  quantity: number;
  memo?: string;
}

export interface LocationMoveFormData {
  toLocation: string;
}

export interface OfflineAction {
  id: string;
  type: 'ADJUST_INVENTORY' | 'MOVE_LOCATION';
  data: any;
  timestamp: number;
  synced: boolean;
}
