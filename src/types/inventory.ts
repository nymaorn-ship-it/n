export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  location?: string;
  defaultSupplier?: string;
  expiryDate?: string; // YYYY-MM-DD
  costPrice?: number;
  sellingPrice?: number;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  sku: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  expiryDate?: string;
  unitCost?: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'pending' | 'partially_received' | 'completed' | 'locked';
  items: PurchaseOrderItem[];
  notes?: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface StockTransaction {
  id: string;
  type: TransactionType;
  sku: string;
  productName: string;
  quantity: number;
  poNumber?: string;
  supplier?: string;
  expiryDate?: string;
  recorderName: string;
  note?: string;
  timestamp: string; // ISO string
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  monthName: string;
  totalIn: number;
  totalOut: number;
  netChange: number;
  transactionCount: number;
}
