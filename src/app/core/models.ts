export type Role = 'DEALER_ADMIN' | 'OWNER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
  branches?: { id: string; name: string }[];
}

export interface Branch {
  id: string;
  customerId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  scaleCount?: number;
  onlineScaleCount?: number;
}

export interface Scale {
  id: string;
  mac: string;
  name: string;
  number: number;
  model?: string | null;
  customerId: string | null;
  branchId: string | null;
  storeName?: string | null;
  firmware?: string | null;
  lastSeenAt: string | null;
  lastIp?: string | null;
  online: boolean;
  pendingCommands?: number;
  branch?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
}

export interface Customer {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  subscriptionEndsAt?: string | null;
  createdAt: string;
  scaleCount?: number;
  onlineScaleCount?: number;
  _count?: { branches: number; users: number; items: number; categories?: number };
}

export interface CustomerDetail extends Customer {
  branches: Branch[];
  users: User[];
  scales: Scale[];
}

export interface Item {
  id: string;
  plu: number;
  name: string;
  barcode?: string | null;
  unit: 'KG' | 'PACK';
  tareGrams: number;
  gstPercent: number;
  gstMode: 'INCLUDED' | 'EXCLUDED';
  defaultPrice: number;
  price?: number;
  stock?: number;
  category?: { id: string; name: string; code: number } | null;
}

export interface Dashboard {
  customers: number;
  activeCustomers: number;
  scales: number;
  onlineScales: number;
  unassignedScales: number;
  billsToday: number;
  salesToday: number;
  expiringSubscriptions: { id: string; name: string; subscriptionEndsAt: string }[];
}

export interface DailyRow {
  date: string;
  bills: number;
  total: number;
  discount: number;
  tax: number;
}

export interface BillLine {
  id: string;
  plu: number;
  name: string;
  unit: 'KG' | 'PACK';
  quantity: number;
  price: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNo: string;
  billedAt: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  lines: BillLine[];
  scale?: { id: string; name: string; number: number } | null;
}

export interface ItemSale {
  plu: number;
  name: string;
  unit: 'KG' | 'PACK';
  lines: number;
  quantity: number;
  amount: number;
}
