import axios from '@/lib/axios';
import type {
  ICoupon,
  CreateCouponInput,
  UpdateCouponInput,
  CouponQuery,
  CouponStats,
  CouponValidationResult,
  CouponApplicationResult,
  CouponResponse
} from '@/types/coupon.types';

class CouponService {
  private readonly baseUrl = '/api/coupons';

  /**
   * Crear nuevo cupón (Admin)
   */
  async createCoupon(data: CreateCouponInput): Promise<ICoupon> {
    const response = await axios.post<CouponResponse>(this.baseUrl, data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al crear cupón');
    }
    
    return response.data.data as ICoupon;
  }

  /**
   * Obtener cupón por ID (Admin)
   */
  async getCouponById(id: string): Promise<ICoupon> {
    const response = await axios.get<CouponResponse>(`${this.baseUrl}/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al obtener cupón');
    }
    
    return response.data.data as ICoupon;
  }

  /**
   * Obtener lista de cupones con filtros (Admin)
   */
  async getCoupons(query: CouponQuery = {}): Promise<{
    data: ICoupon[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get<CouponResponse>(
      `${this.baseUrl}?${params.toString()}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al obtener cupones');
    }
    
    return {
      data: response.data.data as ICoupon[],
      pagination: response.data.pagination!
    };
  }

  /**
   * Actualizar cupón (Admin)
   */
  async updateCoupon(id: string, data: UpdateCouponInput): Promise<ICoupon> {
    const response = await axios.put<CouponResponse>(`${this.baseUrl}/${id}`, data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al actualizar cupón');
    }
    
    return response.data.data as ICoupon;
  }

  /**
   * Eliminar cupón (Admin)
   */
  async deleteCoupon(id: string): Promise<void> {
    const response = await axios.delete<CouponResponse>(`${this.baseUrl}/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar cupón');
    }
  }

  /**
   * Validar cupón por código (Público)
   */
  async validateCoupon(code: string, planCode?: string): Promise<CouponValidationResult> {
    try {
      const params = planCode ? `?planCode=${encodeURIComponent(planCode)}` : '';
      const response = await axios.get<CouponResponse>(
        `${this.baseUrl}/validate/${encodeURIComponent(code)}${params}`
      );
      
      if (!response.data.success) {
        return {
          isValid: false,
          error: response.data.message || 'Cupón inválido'
        };
      }
      
      return {
        isValid: true,
        coupon: response.data.data as any
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.response?.data?.message || 'Error al validar cupón'
      };
    }
  }

  /**
   * Aplicar cupón y calcular descuento (Público)
   */
  async applyCoupon(
    code: string, 
    originalPrice: number, 
    planCode?: string
  ): Promise<CouponApplicationResult> {
    try {
      const response = await axios.post<CouponResponse>(
        `${this.baseUrl}/apply`,
        {
          code,
          originalPrice,
          planCode
        }
      );
      
      if (!response.data.success) {
        return {
          success: false,
          originalPrice,
          finalPrice: originalPrice,
          discount: 0,
          discountPercentage: 0,
          error: response.data.message || 'Error al aplicar cupón'
        };
      }
      
      const data = response.data.data as any;
      return {
        success: true,
        originalPrice: data.originalPrice,
        finalPrice: data.finalPrice,
        discount: data.discount,
        discountPercentage: data.discountPercentage,
        planCode: data.planCode
      };
    } catch (error: any) {
      return {
        success: false,
        originalPrice,
        finalPrice: originalPrice,
        discount: 0,
        discountPercentage: 0,
        error: error.response?.data?.message || 'Error al aplicar cupón'
      };
    }
  }

  /**
   * Obtener estadísticas de cupones (Admin)
   */
  async getCouponStats(): Promise<CouponStats> {
    const response = await axios.get<CouponResponse>(`${this.baseUrl}/stats`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al obtener estadísticas');
    }
    
    return response.data.data as CouponStats;
  }

  /**
   * Formatear valor del cupón para mostrar
   */
  formatCouponValue(coupon: ICoupon): string {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}%`;
      case 'fixed_amount':
        return `$${coupon.value.toLocaleString()}`;
      case 'plan_assignment':
        return coupon.planCode || 'N/A';
      default:
        return coupon.value.toString();
    }
  }

  /**
   * Obtener etiqueta del tipo de cupón
   */
  getTypeLabel(type: string): string {
    const labels = {
      percentage: 'Porcentual',
      fixed_amount: 'Monto Fijo',
      plan_assignment: 'Asignación de Plan'
    };
    return labels[type as keyof typeof labels] || type;
  }

  /**
   * Verificar si un cupón está vigente
   */
  isCouponValid(coupon: ICoupon): boolean {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    const isExpired = now > validUntil;
    const isNotStarted = now < validFrom;
    const isExhausted = coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;

    return coupon.isActive && !isExpired && !isNotStarted && !isExhausted;
  }

  /**
   * Obtener estado del cupón
   */
  getCouponStatus(coupon: ICoupon): {
    status: 'active' | 'inactive' | 'expired' | 'pending' | 'exhausted';
    label: string;
  } {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    const isExpired = now > validUntil;
    const isNotStarted = now < validFrom;
    const isExhausted = coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;

    if (!coupon.isActive) {
      return { status: 'inactive', label: 'Inactivo' };
    }
    if (isExpired) {
      return { status: 'expired', label: 'Expirado' };
    }
    if (isNotStarted) {
      return { status: 'pending', label: 'Pendiente' };
    }
    if (isExhausted) {
      return { status: 'exhausted', label: 'Agotado' };
    }
    return { status: 'active', label: 'Activo' };
  }
}

export const couponService = new CouponService();
export default couponService;