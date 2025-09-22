import axios from '@/lib/axios';

export interface InvoiceItem {
  type: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  days?: number;
}

export interface Invoice {
  _id: string;
  profileId: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
    email: string;
    name: string;
  };
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  paidAt?: string;
  paymentData?: {
    paymentMethod: string;
    paymentReference?: string;
    transactionId?: string;
    amount: number;
    currency: string;
    bankName?: string;
    accountNumber?: string;
    timestamp: string;
  };
  notes?: string;
  isExpired: boolean;
  id: string;
  __v: number;
  coupon?: {
    originalAmount?: number;
    discountAmount?: number;
    code?: string;
    name?: string;
  };
}

export interface CreateInvoiceData {
  profileId: string;
  userId: string;
  planCode: string;
  planDays?: number;
  couponCode?: string; // Código de cupón a aplicar
  upgrades?: Array<{
    upgradeId: string;
    quantity: number;
  }>;
  notes?: string;
}

export interface InvoiceFilters {
  _id?: string;
  status?: string;
  userId?: string;
  profileId?: string;
  startDate?: string;
  endDate?: string;
}

export interface WhatsAppData {
  message: string;
  whatsappUrl: string;
  phoneNumber: string;
  invoice: {
    id: string;
    totalAmount: number;
    expiresAt: string;
    items: InvoiceItem[];
    profileName: string;
    userName: string;
  };
}

class InvoiceService {
  private baseURL = '/api/invoices';

  /**
   * Crear una nueva factura
   */
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const response = await axios.post(this.baseURL, data);
    return response.data.data;
  }

  /**
   * Obtener una factura por ID
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const response = await axios.get(`${this.baseURL}/${invoiceId}`);
    return response.data.data;
  }

  /**
   * Obtener facturas con filtros y paginación
   */
  async getInvoices(
    filters: InvoiceFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await axios.get(`${this.baseURL}?${params}`);
    return response.data.data;
  }

  /**
   * Obtener facturas pendientes de un usuario
   */
  async getPendingInvoicesByUser(userId: string): Promise<Invoice[]> {
    const response = await axios.get(`${this.baseURL}/user/${userId}/pending`);
    return response.data.data;
  }

  /**
   * Obtener todas las facturas de un usuario con paginación y filtros
   */
  async getUserInvoices(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    invoiceId?: string,
    profileId?: string
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
    currentPage: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    if (invoiceId) {
      params.append('invoiceId', invoiceId);
    }

    if (profileId) {
      params.append('profileId', profileId);
    }

    const response = await axios.get(`${this.baseURL}/user/${userId}?${params}`);
    return response.data.data;
  }

  /**
   * Marcar factura como pagada
   */
  async markAsPaid(
    invoiceId: string,
    paymentData: {
      paymentMethod: string;
      paymentReference?: string;
    }
  ): Promise<Invoice> {
    const response = await axios.patch(`${this.baseURL}/${invoiceId}/paid`, paymentData);
    return response.data.data;
  }

  /**
   * Cancelar factura
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const response = await axios.patch(`${this.baseURL}/${invoiceId}/cancel`);
    return response.data.data;
  }

  /**
   * Actualizar estado de factura (solo administradores)
   */
  async updateInvoiceStatus(
    invoiceId: string,
    status: 'pending' | 'paid' | 'cancelled' | 'expired',
    reason?: string
  ): Promise<Invoice> {
    const response = await axios.patch(`${this.baseURL}/${invoiceId}/status`, {
      status,
      reason
    });
    return response.data.data;
  }

  /**
   * Obtener estadísticas de facturas
   */
  async getInvoiceStats(userId?: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    expired: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    const params = userId ? `?userId=${userId}` : '';
    const response = await axios.get(`${this.baseURL}/stats${params}`);
    return response.data.data;
  }

  /**
   * Obtener datos para WhatsApp
   */
  async getWhatsAppData(
    invoiceId: string,
    phoneNumber?: string
  ): Promise<WhatsAppData> {
    const params = phoneNumber ? `?phoneNumber=${phoneNumber}` : '';
    const response = await axios.get(`${this.baseURL}/${invoiceId}/whatsapp-data${params}`);
    return response.data.data;
  }

  /**
   * Expirar facturas vencidas
   */
  async expireOverdueInvoices(): Promise<{
    expiredCount: number;
    expiredInvoices: string[];
  }> {
    const response = await axios.post(`${this.baseURL}/expire-overdue`);
    return response.data.data;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;