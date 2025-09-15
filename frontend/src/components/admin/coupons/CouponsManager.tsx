'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Eye, TrendingUp, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '@/services/coupon.service';
import type { ICoupon, CouponStats } from '@/types/coupon.types';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [stats, setStats] = useState<CouponStats>({
    total: 0,
    active: 0,
    expired: 0,
    exhausted: 0,
    byType: {
      percentage: 0,
      fixed_amount: 0,
      plan_assignment: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'exhausted'>('all');
  const router = useRouter();

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getCoupons();
      setCoupons(response.data);
      
      // Calcular estadísticas desde los datos
      const stats = {
        total: response.data.length,
        active: response.data.filter(c => c.isActive && new Date(c.validUntil) > new Date()).length,
        expired: response.data.filter(c => new Date(c.validUntil) <= new Date()).length,
        exhausted: response.data.filter(c => c.currentUses >= c.maxUses && c.maxUses > 0).length,
        byType: {
          percentage: response.data.filter(c => c.type === 'percentage').length,
          fixed_amount: response.data.filter(c => c.type === 'fixed_amount').length,
          plan_assignment: response.data.filter(c => c.type === 'plan_assignment').length
        }
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Error al cargar los cupones');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cupón?')) {
      return;
    }

    try {
      await couponService.deleteCoupon(couponId);
      toast.success('Cupón eliminado exitosamente');
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Error al eliminar el cupón');
    }
  };

  const getStatusBadge = (coupon: ICoupon) => {
    const now = new Date();
    const expiryDate = new Date(coupon.validUntil);
    
    if (coupon.currentUses >= coupon.maxUses) {
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
        return coupon.isActive && expiryDate >= now && coupon.currentUses < coupon.maxUses;
      case 'expired':
        return expiryDate < now;
      case 'exhausted':
          return coupon.currentUses >= coupon.maxUses;
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestión de Cupones
          </h1>
        </div>
        <Button 
          onClick={() => router.push('/adminboard/coupons/create')}
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
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilizados</p>
                <p className="text-2xl font-bold text-purple-600">{stats.exhausted}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
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
                variant={filterStatus === 'exhausted' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('exhausted')}
                size="sm"
              >
                Utilizados
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
                        <span>Expira: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/adminboard/coupons/edit/${coupon._id}`)}
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