'use client';

import { useState } from 'react';
import { X, Ticket, User, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ICoupon } from '@/types/coupon.types';
import { Profile } from '@/types/user.types';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: ICoupon | null;
  userProfiles: Profile[];
  onApplyCoupon: (profileId: string) => void;
  isApplying?: boolean;
}

export default function CouponModal({
  isOpen,
  onClose,
  coupon,
  userProfiles,
  onApplyCoupon,
  isApplying = false
}: CouponModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 6;

  // Filtrar perfiles según los planes elegibles del cupón
  const getEligibleProfiles = () => {
    if (!coupon || !coupon.applicablePlans || coupon.applicablePlans.length === 0) {
      return userProfiles; // Si no hay restricciones, mostrar todos los perfiles
    }

    return userProfiles.filter(profile => {
      // Si el perfil no tiene plan asignado, no es elegible
      if (!profile.planAssignment?.planCode) {
        return false;
      }

      // Verificar si el plan del perfil está en la lista de planes aplicables
      const profilePlanId = `${profile.planAssignment.planId}-${profile.planAssignment.variantDays}`;
      return coupon.applicablePlans.includes(profilePlanId);
    });
  };

  const eligibleProfiles = getEligibleProfiles();

  // Calcular paginación con perfiles elegibles
  const totalPages = Math.ceil(eligibleProfiles.length / profilesPerPage);
  const startIndex = (currentPage - 1) * profilesPerPage;
  const endIndex = startIndex + profilesPerPage;
  const currentProfiles = eligibleProfiles.slice(startIndex, endIndex);

  const handleApply = () => {
    if (selectedProfileId) {
      onApplyCoupon(selectedProfileId);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedProfileId(''); // Limpiar selección al cambiar de página
  };

  const formatDiscountValue = (coupon: ICoupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    }
    if (coupon.type === 'fixed_amount') {
      return `$${coupon.value.toLocaleString()}`;
    }
    return 'Plan asignado';
  };

  const getDiscountDescription = (coupon: ICoupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% de descuento`;
    }
    if (coupon.type === 'fixed_amount') {
      return `$${coupon.value.toLocaleString()} de descuento`;
    }
    return 'Asignación de plan específico';
  };

  if (!coupon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Ticket className="h-5 w-5 text-purple-600" />
            <span>Aplicar Cupón</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del cupón */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                    {coupon.code}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {coupon.description}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {formatDiscountValue(coupon)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Descuento:</span>
                  <p className="text-gray-800 dark:text-gray-200">{getDiscountDescription(coupon)}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Válido hasta:</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {new Date(coupon.validUntil).toLocaleDateString('es-ES')}
                  </p>
                </div>

                {coupon.remainingUses !== undefined && coupon.remainingUses !== -1 && (
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Usos disponibles:</span>
                    <p className="text-gray-800 dark:text-gray-200">
                      {coupon.remainingUses === -1 ? 'Ilimitado' : coupon.remainingUses}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selección de perfil */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Selecciona un perfil para aplicar el cupón</span>
              </h4>
              {eligibleProfiles.length > profilesPerPage && (
                <div className="text-sm text-gray-500">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, eligibleProfiles.length)} de {eligibleProfiles.length} perfiles elegibles
                </div>
              )}
            </div>

            {eligibleProfiles.length === 0 ? (
              <Card className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No tienes perfiles elegibles para este cupón.
                </p>
                {coupon && coupon.applicablePlans && coupon.applicablePlans.length > 0 && (
                  <p className="text-sm text-gray-400">
                    Este cupón solo es válido para planes específicos. Asegúrate de tener perfiles con los planes correctos.
                  </p>
                )}
              </Card>
            ) : (
              <>
                {/* Grid de perfiles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProfiles.map((profile) => (
                    <Card
                      key={profile._id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedProfileId === profile._id
                          ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedProfileId(profile._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {/* Avatar rectangular */}
                          <div className="relative">
                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                              {(profile as any).photos?.[0]?.url ? (
                                <img
                                  src={(profile as any).photos[0].url}
                                  alt={profile.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-purple-600 dark:text-purple-300">
                                  {profile.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {profile.name}
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {profile.age} años • {typeof profile.location?.city === 'object' && profile.location?.city !== null && 'label' in profile.location.city 
                                ? (profile.location.city as any).label 
                                : typeof profile.location?.city === 'object' && profile.location?.city !== null 
                                  ? JSON.stringify(profile.location.city)
                                  : profile.location?.city || 'Ciudad no especificada'
                              }
                            </p>
                            {profile.planAssignment && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Plan {profile.planAssignment.planCode}
                              </Badge>
                            )}
                          </div>
                          {selectedProfileId === profile._id && (
                            <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={currentPage === page ? "bg-purple-600 hover:bg-purple-700" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isApplying}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedProfileId || isApplying || userProfiles.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isApplying ? 'Aplicando...' : 'Aplicar Cupón'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}