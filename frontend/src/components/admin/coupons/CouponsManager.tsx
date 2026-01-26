'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCoupons, useCouponStats, useDeleteCoupon } from '@/hooks/use-coupons';
import type { ICoupon } from '@/types/coupon.types';
import { Edit, Eye, Plus, Search, Ticket, Trash2, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CouponsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'used' | 'exhausted'>('all');
  const router = useRouter();

  // Usar useQuery para obtener cupones y estadísticas
  const { data: couponsResponse, isLoading: loadingCoupons, error: couponsError } = useCoupons();
  const { data: stats, isLoading: loadingStats } = useCouponStats();
  const deleteCoponMutation = useDeleteCoupon();

  const coupons = couponsResponse?.data || [];
  const loading = loadingCoupons || loadingStats;

  // Valores por defecto para stats para evitar errores
  const safeStats = stats || {
    total: 0,
    active: 0,
    expired: 0,
    exhausted: 0,
    byType: {
      percentage: 0,
      fixed_amount: 0,
      plan_assignment: 0
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cupón?')) {
      return;
    }

    deleteCoponMutation.mutate(couponId);
  };

  const getStatusBadge = (coupon: ICoupon) => {
    const now = new Date();
    const expiryDate = new Date(coupon.validUntil);

    // Verificar si el cupón tiene usos ilimitados (-1) o si aún tiene usos disponibles
    if (coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses) {
      return <Badge variant="secondary">Agotado</Badge>;
    }
    if (expiryDate < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (coupon.isActive) {
      return <Badge variant="default">Activo</Badge>;
    }
    return <Badge variant="outline">Inactivo</Badge>;
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    const now = new Date();
    const expiryDate = new Date(coupon.validUntil);

    switch (filterStatus) {
      case 'active':
        // Verificar si está activo, no expirado y tiene usos disponibles (o es ilimitado)
        const hasUsesAvailable = coupon.maxUses === -1 || coupon.currentUses < coupon.maxUses;
        return coupon.isActive && expiryDate >= now && hasUsesAvailable;
      case 'expired':
        // Solo cupones expirados por fecha, excluyendo los agotados
        const isNotExhausted = coupon.maxUses === -1 || coupon.currentUses < coupon.maxUses;
        return expiryDate < now && isNotExhausted;
      case 'used':
        // Cupones que se han usado al menos 1 vez pero NO están agotados ni expirados
        const notExhaustedYet = coupon.maxUses === -1 || coupon.currentUses < coupon.maxUses;
        return coupon.currentUses > 0 && notExhaustedYet && expiryDate >= now;
      case 'exhausted':
        // Cupones agotados (alcanzaron el límite de usos)
        return coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Cupones</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Ticket className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-200">
            Gestión de Cupones
          </h1>
        </div>
        <Button
          onClick={() => router.push(`/adminboard/coupons/create?returnUrl=${encodeURIComponent('/adminboard?section=cupones')}`)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Cupón
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cupones</p>
                <p className="text-2xl font-bold">{safeStats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">{safeStats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expirados</p>
                <p className="text-2xl font-bold text-red-600">{safeStats.expired}</p>
              </div>
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agotados</p>
                <p className="text-2xl font-bold text-orange-600">{safeStats.exhausted}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar cupones por código o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Activos
              </Button>
              <Button
                variant={filterStatus === 'expired' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('expired')}
                size="sm"
              >
                Expirados
              </Button>
              <Button
                variant={filterStatus === 'used' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('used')}
                size="sm"
              >
                Utilizados
              </Button>
              <Button
                variant={filterStatus === 'exhausted' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('exhausted')}
                size="sm"
              >
                Agotados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupones ({filteredCoupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron cupones</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <div key={coupon._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{coupon.code}</h3>
                        {getStatusBadge(coupon)}
                      </div>
                      <p className="text-muted-foreground mt-1">{coupon.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>Descuento: {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}</span>
                        <span>Usos: {coupon.currentUses}/{coupon.maxUses}</span>
                        <span>
                          Expira: {new Date(coupon.validUntil).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                        </span>
                      </div>
                      {/* <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-muted-foreground">Planes aplicables:</span>
                        {coupon.applicablePlans && coupon.applicablePlans.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {coupon.applicablePlans.map((plan) => (
                              <Badge key={plan} variant="secondary" className="text-xs">
                                {plan}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Todos los planes
                          </Badge>
                        )}
                      </div> */}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/adminboard/coupons/edit/${coupon._id}?returnUrl=${encodeURIComponent('/adminboard?section=cupones')}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => coupon._id && handleDeleteCoupon(coupon._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}