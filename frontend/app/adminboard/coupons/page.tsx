'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Eye, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { couponService } from '@/services/coupon.service';
import type { ICoupon, CouponStats } from '@/types/coupon.types';

interface CouponsPageState {
  coupons: ICoupon[];
  stats: CouponStats | null;
  loading: boolean;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  selectedType: string;
  selectedStatus: string;
}

export default function CouponsPage() {
  const router = useRouter();
  const [state, setState] = useState<CouponsPageState>({
    coupons: [],
    stats: null,
    loading: true,
    searchTerm: '',
    currentPage: 1,
    totalPages: 1,
    selectedType: 'all',
    selectedStatus: 'all'
  });

  const loadCoupons = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const params = {
        page: state.currentPage,
        limit: 10,
        ...(state.searchTerm && { code: state.searchTerm }),
        ...(state.selectedType !== 'all' && { type: state.selectedType }),
        ...(state.selectedStatus === 'active' && { isActive: true }),
        ...(state.selectedStatus === 'inactive' && { isActive: false }),
        ...(state.selectedStatus === 'valid' && { validOnly: true })
      };

      const response = await couponService.getCoupons(params);
      
      setState(prev => ({
        ...prev,
        coupons: response.data,
        totalPages: response.pagination.pages,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Error al cargar cupones');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadStats = async () => {
    try {
      const stats = await couponService.getCouponStats();
      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón?')) {
      return;
    }

    try {
      await couponService.deleteCoupon(id);
      toast.success('Cupón eliminado exitosamente');
      loadCoupons();
      loadStats();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Error al eliminar cupón');
    }
  };

  const getStatusBadge = (coupon: ICoupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    const isExpired = now > validUntil;
    const isNotStarted = now < validFrom;
    const isExhausted = coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (isNotStarted) {
      return <Badge variant="outline">Pendiente</Badge>;
    }
    if (isExhausted) {
      return <Badge variant="destructive">Agotado</Badge>;
    }
    return <Badge variant="default">Activo</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      percentage: 'Porcentual',
      fixed_amount: 'Monto Fijo',
      plan_assignment: 'Asignación de Plan'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatValue = (coupon: ICoupon) => {
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
  };

  useEffect(() => {
    loadCoupons();
    loadStats();
  }, [state.currentPage, state.selectedType, state.selectedStatus]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (state.currentPage === 1) {
        loadCoupons();
      } else {
        setState(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [state.searchTerm]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cupones</h1>
          <p className="text-muted-foreground">Administra cupones y descuentos</p>
        </div>
        <Button onClick={() => router.push('/adminboard/coupons/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Cupón
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Cupones</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {state.stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cupones</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{state.stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{state.stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expirados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{state.stats.expired}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agotados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{state.stats.exhausted}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código..."
                      value={state.searchTerm}
                      onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={state.selectedType}
                  onChange={(e) => setState(prev => ({ ...prev, selectedType: e.target.value, currentPage: 1 }))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="percentage">Porcentual</option>
                  <option value="fixed_amount">Monto Fijo</option>
                  <option value="plan_assignment">Asignación de Plan</option>
                </select>
                <select
                  value={state.selectedStatus}
                  onChange={(e) => setState(prev => ({ ...prev, selectedStatus: e.target.value, currentPage: 1 }))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="valid">Válidos</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {state.loading ? (
                <div className="text-center py-8">Cargando cupones...</div>
              ) : state.coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron cupones
                </div>
              ) : (
                <div className="space-y-4">
                  {state.coupons.map((coupon) => (
                    <div key={coupon._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{coupon.code}</h3>
                            {getStatusBadge(coupon)}
                            <Badge variant="outline">{getTypeLabel(coupon.type)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{coupon.name}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Valor: <strong>{formatValue(coupon)}</strong></span>
                            <span>Usos: <strong>{coupon.currentUses}/{coupon.maxUses === -1 ? '∞' : coupon.maxUses}</strong></span>
                            <span>Válido hasta: <strong>{new Date(coupon.validUntil).toLocaleDateString()}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/adminboard/coupons/${coupon._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/adminboard/coupons/edit/${coupon._id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(coupon._id!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={state.currentPage === 1}
                    onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4">
                    Página {state.currentPage} de {state.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={state.currentPage === state.totalPages}
                    onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}