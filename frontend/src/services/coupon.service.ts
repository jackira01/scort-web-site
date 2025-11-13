import axios from '@/lib/axios';
import { API_URL } from '@/lib/config';
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
  private readonly baseUrl = `${API_URL}/api/coupons`;

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
   * Validar cupón
   */
  async validateCoupon(code: string, planCode?: string): Promise<CouponValidationResult> {
    try {
      const response = await axios.get<CouponResponse>(`${this.baseUrl}/validate/${code}`, {
        params: planCode ? { planCode } : {}
      });

      if (!response.data.success) {
        return {
          isValid: false,
          error: response.data.message || 'Cupón no válido'
        };
      }

      // Transformar la respuesta del backend al formato esperado
      const couponData = response.data.data as ICoupon;
      return {
        isValid: true,
        coupon: {
          code: couponData.code,
          name: couponData.name,
          type: couponData.type,
          value: couponData.value,
          planCode: couponData.planCode
        }
      };
    } catch (error: unknown) {
      let errorMessage = 'Error al validar cupón';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      return {
        isValid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validar cupón para el frontend (sin autenticación)
   */
  async validateCouponForFrontend(code: string): Promise<{
    success: boolean;
    message: string;
    data?: ICoupon;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/validate-frontend`, {
        code: code.trim().toUpperCase()
      });

      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || 'Cupón no válido'
        };
      }

      // Mapear la respuesta del backend al formato ICoupon
      const couponData = response.data.data;
      const mappedCoupon: ICoupon = {
        code: couponData.code,
        name: couponData.name,
        description: couponData.description,
        type: couponData.type,
        value: couponData.value,
        planCode: couponData.planCode,

        // NUEVA ESTRUCTURA - Combinaciones exactas plan-variante
        validPlanVariants: couponData.validPlanVariants || [],

        // ESTRUCTURAS ANTIGUAS (compatibilidad)
        validPlanCodes: couponData.validPlanCodes || [],
        validVariantDays: couponData.validVariantDays || [],
        validPlanIds: couponData.validPlanIds || [],
        validUpgradeIds: couponData.validUpgradeIds || [],
        variantDays: couponData.variantDays || 0,
        applicablePlans: couponData.applicablePlans || [],

        maxUses: -1, // No se devuelve en la respuesta
        currentUses: 0, // No se devuelve en la respuesta
        remainingUses: couponData.remainingUses,
        validFrom: '', // No se devuelve en la respuesta
        validUntil: couponData.validUntil,
        isActive: true, // Asumimos que es activo si es válido
        createdBy: {
          _id: '',
          name: '',
          email: ''
        },
        createdAt: '',
        updatedAt: ''
      };

      return {
        success: true,
        message: response.data.message || 'Cupón válido',
        data: mappedCoupon
      };
    } catch (error: unknown) {
      let errorMessage = 'Error al validar cupón';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Aplicar cupón y calcular descuento (Público)
   */
  async applyCoupon(
    code: string,
    originalPrice: number,
    planCode?: string,
    variantDays?: number
  ): Promise<CouponApplicationResult> {


    try {
      const requestBody = {
        code,
        originalPrice,
        planCode,
        variantDays
      };

      const response = await axios.post<CouponResponse>(
        `${this.baseUrl}/apply`,
        requestBody
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

      const data = response.data.data as {
        originalPrice: number;
        finalPrice: number;
        discount: number;
        discountPercentage: number;
        planCode: string;
      };
      const result = {
        success: true,
        originalPrice: data.originalPrice,
        finalPrice: data.finalPrice,
        discount: data.discount,
        discountPercentage: data.discountPercentage,
        planCode: data.planCode
      };


      return result;
    } catch (error: unknown) {
      let errorMessage = 'Error al aplicar cupón';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        originalPrice,
        finalPrice: originalPrice,
        discount: 0,
        discountPercentage: 0,
        error: errorMessage
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