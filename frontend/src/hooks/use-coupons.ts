import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/coupon.service';
import type { ICoupon, CreateCouponInput, UpdateCouponInput, CouponQuery, CouponStats } from '@/types/coupon.types';
import toast from 'react-hot-toast';

// Hook para obtener cupones con filtros
export const useCoupons = (query: CouponQuery = {}) => {
  return useQuery({
    queryKey: ['coupons', query],
    queryFn: () => couponService.getCoupons(query),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener un cupón específico
export const useCoupon = (id: string) => {
  return useQuery({
    queryKey: ['coupon', id],
    queryFn: () => couponService.getCouponById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook para obtener estadísticas de cupones
export const useCouponStats = () => {
  return useQuery({
    queryKey: ['coupon-stats'],
    queryFn: () => couponService.getCouponStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para crear cupón
export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponInput) => couponService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      toast.success('Cupón creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el cupón');
    },
  });
};

// Hook para actualizar cupón
export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponInput }) => 
      couponService.updateCoupon(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon', id] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      toast.success('Cupón actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el cupón');
    },
  });
};

// Hook para eliminar cupón
export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      toast.success('Cupón eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el cupón');
    },
  });
};

// Hook para validar cupón
export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: ({ code, planCode }: { code: string; planCode?: string }) => 
      couponService.validateCoupon(code, planCode),
    onError: (error: any) => {
      toast.error(error.message || 'Error al validar el cupón');
    },
  });
};

// Hook para aplicar cupón
export const useApplyCoupon = () => {
  return useMutation({
    mutationFn: ({ code, originalPrice, planCode }: { 
      code: string; 
      originalPrice: number; 
      planCode?: string 
    }) => couponService.applyCoupon(code, originalPrice, planCode),
    onSuccess: () => {
      toast.success('Cupón aplicado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al aplicar el cupón');
    },
  });
};