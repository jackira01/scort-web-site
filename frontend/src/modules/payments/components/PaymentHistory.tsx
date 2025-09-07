import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Receipt, Calendar, CreditCard, User, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useUserInvoices } from '@/hooks/use-user-invoices';
import { Invoice } from '@/services/invoice.service';

interface PaymentHistoryProps {
  className?: string;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'expired':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Pagado';
    case 'pending':
      return 'Pendiente';
    case 'cancelled':
      return 'Cancelado';
    case 'expired':
      return 'Expirado';
    default:
      return status;
  }
};

const PaymentHistory = ({ className }: PaymentHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [invoiceIdFilter, setInvoiceIdFilter] = useState<string>('');
  const [profileIdFilter, setProfileIdFilter] = useState<string>('');
  const [pageSize] = useState(10);

  const {
    invoices,
    total,
    totalPages,
    isLoading,
    error,
    refetch
  } = useUserInvoices({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
    invoiceId: invoiceIdFilter || undefined,
    profileId: profileIdFilter || undefined
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleInvoiceIdFilterChange = (value: string) => {
    setInvoiceIdFilter(value);
    setCurrentPage(1);
  };

  const handleProfileIdFilterChange = (value: string) => {
    setProfileIdFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setInvoiceIdFilter('');
    setProfileIdFilter('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Historial de Facturas
        </h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error al cargar las facturas</p>
              <Button onClick={() => refetch()} variant="outline">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500 ${className}`}>
      <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Historial de Facturas
      </h1>

      {/* Filtros */}
      <Card className="border-gray-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Estado:
              </label>
              <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ID de Factura:
              </label>
              <Input
                placeholder="Filtrar por ID de factura"
                value={invoiceIdFilter}
                onChange={(e) => handleInvoiceIdFilterChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ID de Perfil:
              </label>
              <Input
                placeholder="Filtrar por ID de perfil"
                value={profileIdFilter}
                onChange={(e) => handleProfileIdFilterChange(e.target.value)}
              />
            </div>

            <Button onClick={clearFilters} variant="outline">
              Limpiar Filtros
            </Button>
          </div>

          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {invoices.length} de {total} facturas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Receipt className="h-5 w-5" />
            Facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Cargando facturas...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No se encontraron facturas</p>
              <p className="text-sm text-gray-500">
                {statusFilter ? 'Intenta cambiar el filtro de estado' : 'Aún no tienes facturas registradas'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-white/70 hover:bg-white/90 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Receipt className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {invoice.items[0]?.name || 'Factura'}
                        </p>
                        {invoice.profileId && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {invoice.profileId.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
                        </span>
                        {invoice.paymentData?.paymentMethod && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {invoice.paymentData.paymentMethod}
                          </span>
                        )}
                      </div>
                      {invoice.notes && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                          {invoice.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 mb-1">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                    <Badge
                      variant={getStatusBadgeVariant(invoice.status)}
                      className="text-xs"
                    >
                      {getStatusText(invoice.status)}
                    </Badge>
                    {invoice.status === 'pending' && invoice.expiresAt && (
                      <p className="text-xs text-orange-600 mt-1">
                        Expira: {new Date(invoice.expiresAt).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
