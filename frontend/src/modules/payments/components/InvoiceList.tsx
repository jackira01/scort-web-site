'use client';

import { useState, useEffect } from 'react';
import { Clock, CreditCard, Eye, MessageCircle, MoreHorizontal, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { invoiceService, type Invoice, type InvoiceFilters } from '@/services/invoice.service';
import { useSession } from 'next-auth/react';
import { PayInvoicesModal } from './PayInvoicesModal';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';

interface InvoiceListProps {
  userId?: string;
  showFilters?: boolean;
  pageSize?: number;
}

export function InvoiceList({ userId, showFilters = true, pageSize = 10 }: InvoiceListProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<InvoiceFilters>({
    userId: userId || session?.user?.id,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices(filters, currentPage, pageSize);
      setInvoices(response.invoices);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters, currentPage]);

  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      paid: { label: 'Pagada', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      expired: { label: 'Expirada', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 0) return 'Expirada';
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPayModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Facturas</h2>
        <Button onClick={() => fetchInvoices()} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Fecha desde</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Fecha hasta</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ userId: userId || session?.user?.id });
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de facturas */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay facturas</h3>
              <p className="text-muted-foreground">
                No se encontraron facturas con los filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{invoice._id.slice(-8)}</Badge>
                      {getStatusBadge(invoice.status)}
                      {invoice.status === 'pending' && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeUntilExpiry(invoice.expiresAt)}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium text-lg">
                        ${invoice.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.items.map(item => {
                          const daysText = item.days ? ` (${item.days} días)` : '';
                          return `${item.name}${daysText}`;
                        }).join(', ')}
                      </p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>Creada: {formatDate(invoice.createdAt)}</p>
                      {invoice.status === 'pending' && (
                        <p>Expira: {formatDate(invoice.expiresAt)}</p>
                      )}
                      {invoice.paidAt && (
                        <p>Pagada: {formatDate(invoice.paidAt)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayInvoice(invoice)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {invoice.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handlePayInvoice(invoice)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar por WhatsApp
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modales */}
      {selectedInvoice && showPayModal && (
        <PayInvoicesModal
          open={showPayModal}
          onOpenChange={(open) => {
            setShowPayModal(open);
            if (!open) {
              setSelectedInvoice(null);
              fetchInvoices(); // Refrescar lista después de pagar
            }
          }}
          invoices={[selectedInvoice]}
        />
      )}

      {selectedInvoice && showDetailsModal && (
        <InvoiceDetailsModal
          open={showDetailsModal}
          onOpenChange={(open) => {
            setShowDetailsModal(open);
            if (!open) setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}