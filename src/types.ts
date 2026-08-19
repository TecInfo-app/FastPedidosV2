export interface Store {
  id: string;
  name: string;
  isActiveToday?: boolean; // Whether active/working today
}

export interface Motoboy {
  id: string;
  name: string;
  password?: string; // 4-digit PIN/Password
  isActiveToday?: boolean; // Whether active/working today
  status?: 'disponivel' | 'entrega' | 'retornando'; // 'disponivel' (na loja), 'entrega' (saiu), 'retornando'
  statusUpdatedAt?: number;
}

export interface Rate {
  id: string;
  description: string; // 'Taxa Fixa' or 'Taxa Avulsa'
  value: string; // formatted as '7.50'
  isActiveToday?: boolean; // Whether active today
}

export interface Order {
  id: string;
  orderNumber: string;
  storeName: string;
  motoboyName: string;
  feeValue: string; // '7.50'
  feeDescription: string; // 'Taxa Fixa' | 'Taxa Avulsa'
  timestamp: number;
  customerName?: string;
  deliveryAddress?: string;
  deliveryStatus?: 'pendente' | 'entregue'; // Optional delivery status
  confirmationCode?: string; // Optional 4-digit code for iFood
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface DailyReport {
  id: string;
  date: string; // 'DD/MM/YYYY'
  timestamp: number;
  totalOrders: number;
  totalValue: number;
  orders: Order[];
}
