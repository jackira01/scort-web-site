'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

interface DebugInfo {
  profileId: string;
  profileName: string;
  planAssignment: any;
  planInfo: any;
  upgrades: any[];
  activeUpgrades: any[];
  upgradeFlags: {
    hasDestacadoUpgrade: boolean;
    hasImpulsoUpgrade: boolean;
  };
  availableUpgrades: any[];
  validationChecks: {
    hasActivePlan: boolean;
    planExpired: boolean | null;
    canPurchaseDestacado: boolean;
    canPurchaseImpulso: boolean;
  };
}

const UpgradeDebugPanel: React.FC = () => {
  const [profileId, setProfileId] = useState('');
  const [userId, setUserId] = useState('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const debugProfileStructure = async () => {
    if (!profileId.trim()) {
      toast.error('Por favor ingresa un ID de perfil');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/profile/${profileId}/debug-structure`);
      if (response.data.success) {
        setDebugInfo(response.data.data);
        toast.success('Información de debug obtenida exitosamente');
      } else {
        toast.error('Error al obtener información de debug');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al obtener información de debug');
    } finally {
      setLoading(false);
    }
  };

  const debugUserProfiles = async () => {
    if (!userId.trim()) {
      toast.error('Por favor ingresa un ID de usuario');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/profile/user/${userId}/debug-profiles`);
      if (response.data.success) {
        setUserProfiles(response.data.profiles);
        toast.success('Perfiles de usuario obtenidos exitosamente');
      } else {
        toast.error('Error al obtener perfiles de usuario');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al obtener perfiles de usuario');
    } finally {
      setLoading(false);
    }
  };

  const testUpgradePurchase = async (upgradeCode: string) => {
    if (!profileId.trim()) {
      toast.error('Por favor ingresa un ID de perfil');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/profile/${profileId}/purchase-upgrade`, {
        upgradeCode
      });

      if (response.data.success) {
        toast.success(`Upgrade ${upgradeCode} comprado exitosamente`);
        // Refrescar la información de debug
        await debugProfileStructure();
      } else {
        toast.error(response.data.message || 'Error al comprar upgrade');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al comprar upgrade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Panel de Debug - Upgrades y Planes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profileId">ID del Perfil</Label>
              <Input
                id="profileId"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                placeholder="Ingresa el ID del perfil"
              />
              <Button
                onClick={debugProfileStructure}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Cargando...' : 'Debug Perfil'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">ID del Usuario</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Ingresa el ID del usuario"
              />
              <Button
                onClick={debugUserProfiles}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Cargando...' : 'Debug Usuario'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Perfil: {debugInfo.profileName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Plan Assignment</h4>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.planAssignment, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Plan Info</h4>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.planInfo, null, 2)}
                </pre>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Validaciones</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={debugInfo.validationChecks.hasActivePlan ? 'default' : 'destructive'}>
                  Plan Activo: {debugInfo.validationChecks.hasActivePlan ? 'Sí' : 'No'}
                </Badge>
                <Badge variant={debugInfo.validationChecks.canPurchaseDestacado ? 'default' : 'secondary'}>
                  Puede Destacado: {debugInfo.validationChecks.canPurchaseDestacado ? 'Sí' : 'No'}
                </Badge>
                <Badge variant={debugInfo.validationChecks.canPurchaseImpulso ? 'default' : 'secondary'}>
                  Puede Impulso: {debugInfo.validationChecks.canPurchaseImpulso ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Upgrades Activos</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={debugInfo.upgradeFlags.hasDestacadoUpgrade ? 'default' : 'outline'}>
                  Destacado: {debugInfo.upgradeFlags.hasDestacadoUpgrade ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={debugInfo.upgradeFlags.hasImpulsoUpgrade ? 'default' : 'outline'}>
                  Impulso: {debugInfo.upgradeFlags.hasImpulsoUpgrade ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Probar Compra de Upgrades</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => testUpgradePurchase('DESTACADO')}
                  disabled={loading || !debugInfo.validationChecks.canPurchaseDestacado}
                  variant="outline"
                >
                  Comprar Destacado
                </Button>
                <Button
                  onClick={() => testUpgradePurchase('IMPULSO')}
                  disabled={loading || !debugInfo.validationChecks.canPurchaseImpulso}
                  variant="outline"
                >
                  Comprar Impulso
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Perfiles del Usuario ({userProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userProfiles.map((profile, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{profile.profileName}</span>
                      <Badge className="ml-2" variant={profile.hasActivePlan ? 'default' : 'destructive'}>
                        {profile.hasActivePlan ? 'Plan Activo' : 'Sin Plan'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Upgrades: {profile.activeUpgradesCount}/{profile.upgradesCount}
                    </div>
                  </div>
                  {profile.activeUpgrades.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {profile.activeUpgrades.map((upgrade: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {upgrade}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UpgradeDebugPanel;