'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Receipt, Calendar, CreditCard, User, DollarSign, TrendingUp, FileText, Search, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAllInvoices } from '@/hooks/use-all-invoices';
import { Invoice } from '@/services/invoice.service';
import UpdateInvoiceStatusModal from './UpdateInvoiceStatusModal';

interface InvoicesManagerProps {
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

const InvoicesManager = ({ className }: InvoicesManagerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [invoiceIdFilter, setInvoiceIdFilter] = useState<string>('');
  const [invoiceIdSearch, setInvoiceIdSearch] = useState<string>(''); // Estado separado para la búsqueda
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState<string>('');
  const [invoiceNumberSearch, setInvoiceNumberSearch] = useState<string>(''); // Estado separado para la búsqueda por número
  // const [userIdFilter, setUserIdFilter] = useState<string>('');
  // const [profileIdFilter, setProfileIdFilter] = useState<string>('');
  const [pageSize] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const {
    invoices,
    total,
    totalPages,
    isLoading,
    error,
    refetch,
    stats
  } = useAllInvoices({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
    _id: invoiceIdFilter || undefined,
    invoiceNumber: invoiceNumberFilter || undefined,
    // userId: userIdFilter || undefined,
    // profileId: profileIdFilter || undefined
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleInvoiceIdFilterChange = (value: string) => {
    setInvoiceIdSearch(value); // Solo actualiza el estado de búsqueda, no el filtro
  };

  const handleSearchInvoice = () => {
    setInvoiceIdFilter(invoiceIdSearch); // Aplica el filtro cuando se hace clic en buscar
    setCurrentPage(1);
  };

  const handleInvoiceNumberFilterChange = (value: string) => {
    setInvoiceNumberSearch(value); // Solo actualiza el estado de búsqueda, no el filtro
  };

  const handleSearchInvoiceNumber = () => {
    setInvoiceNumberFilter(invoiceNumberSearch); // Aplica el filtro cuando se hace clic en buscar
    setCurrentPage(1);
  };

  // const handleUserIdFilterChange = (value: string) => {
  //   setUserIdFilter(value);
  //   setCurrentPage(1);
  // };

  // const handleProfileIdFilterChange = (value: string) => {
  //   setProfileIdFilter(value);
  //   setCurrentPage(1);
  // };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setInvoiceIdFilter('');
    setInvoiceIdSearch(''); // Limpiar también el estado de búsqueda
    setInvoiceNumberFilter('');
    setInvoiceNumberSearch('');
    // setUserIdFilter('');
    // setProfileIdFilter('');
    setCurrentPage(1);
  };

  const handleUpdateStatus = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsUpdateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedInvoice(null);
  };

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Saldo y Facturas
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
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-200">
        Saldo y Facturas
      </h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Ingresos Totales</h3>
                <p className="text-3xl font-bold">
                  {stats ? formatCurrency(stats.totalRevenue) : '$0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Este Mes</h3>
                <p className="text-3xl font-bold">
                  {stats ? formatCurrency(stats.monthlyRevenue) : '$0.00'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Facturas Pagadas</h3>
                <p className="text-3xl font-bold">
                  {stats ? stats.paidInvoices : 0}
                </p>
              </div>
              <Receipt className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Pendientes</h3>
                <p className="text-3xl font-bold">
                  {stats ? stats.pendingInvoices : 0}
                </p>
              </div>
              <FileText className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-300">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ID de Factura:
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Filtrar por ID de factura"
                  value={invoiceIdSearch}
                  onChange={(e) => handleInvoiceIdFilterChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchInvoice()}
                />
                <Button
                  onClick={handleSearchInvoice}
                  variant="outline"
                  className="px-3"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Número de Factura:
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Filtrar por número de factura"
                  value={invoiceNumberSearch}
                  onChange={(e) => handleInvoiceNumberFilterChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchInvoiceNumber()}
                />
                <Button
                  onClick={handleSearchInvoiceNumber}
                  variant="outline"
                  className="px-3"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={clearFilters} variant="outline">
                Limpiar Filtros
              </Button>
            </div>
          </div>

          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Mostrando {invoices.length} de {total} facturas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Facturas */}
      <Card className="backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-300">
            <Receipt className="h-5 w-5" />
            Facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando facturas...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2 dark:text-gray-300">No se encontraron facturas</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {invoiceIdFilter || invoiceNumberFilter
                  ? 'No se encontró ninguna factura con ese ID o número'
                  : statusFilter
                  ? 'No hay facturas con ese estado'
                  : 'Aún no hay facturas registradas'
                }
              </p>
              {(invoiceIdFilter || invoiceNumberFilter || statusFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-3"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-white/70 hover:bg-white/90 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Receipt className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-300">
                          Factura #{invoice.invoiceNumber || invoice._id.slice(-8)}
                        </p>
                        {invoice.profileId && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {invoice.profileId.name}
                          </Badge>
                        )}
                        {invoice.userId && (
                          <Badge variant="secondary" className="text-xs dark:text-gray-300">
                            Usuario: {invoice.userId.name || invoice.userId.email}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-300">
                        <span className="flex items-center gap-1 dark:text-gray-300">
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
                      {invoice.items.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {invoice.items.map(item => item.name).join(', ')}
                        </p>
                      )}
                      {invoice.notes && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                          {invoice.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1 dark:text-gray-300">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(invoice)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
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

      {/* Modal para actualizar estado */}
      {selectedInvoice && (
        <UpdateInvoiceStatusModal
          invoice={selectedInvoice}
          isOpen={isUpdateModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default InvoicesManager;