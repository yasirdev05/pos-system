// Core entity types matching the Prisma schema

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  _count?: { products: number; purchases: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category?: Category;
  description?: string;
  imageUrl?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  supplierId?: string;
  supplier?: Supplier;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  _count?: { sales: number };
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  userId: string;
  user?: User;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  amountPaid: number;
  change: number;
  status: string;
  items: SaleItem[];
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier: Supplier;
  userId: string;
  user: User;
  totalAmount: number;
  status: string;
  items: PurchaseItem[];
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  product: Product;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  date: string;
  addedById: string;
}

export interface BusinessSettings {
  id: string;
  companyName: string;
  ownerName: string;
  phone?: string;
  email?: string;
  address?: string;
  taxPercentage: number;
  currency: string;
  invoicePrefix: string;
  returnPolicy?: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  recentSales: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentMethod: string;
    customer?: { name: string };
    createdAt: string;
  }[];
}

// Cart types for POS
export interface CartItem {
  product: Product;
  quantity: number;
}
