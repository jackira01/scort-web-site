'use client';

import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UpgradesList from './UpgradesList';
import UpgradeForm from './UpgradeForm';
import { Upgrade } from '@/types/plans';

interface UpgradesManagerState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedUpgrade: Upgrade | null;
}

export default function UpgradesManager() {
  const [state, setState] = useState<UpgradesManagerState>({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    selectedUpgrade: null,
  });

  const handleCreateUpgrade = () => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: true,
      selectedUpgrade: null,
    }));
  };

  const handleEditUpgrade = (upgrade: Upgrade) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedUpgrade: upgrade,
    }));
  };

  const handleCloseModals = () => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: false,
      isEditModalOpen: false,
      selectedUpgrade: null,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Upgrades</h1>
          <p className="text-muted-foreground">
            Administra los upgrades temporales disponibles para los usuarios
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Upgrades Disponibles
              </CardTitle>
              <CardDescription>
                Gestiona los upgrades temporales que pueden adquirir los usuarios para mejorar la visibilidad de sus perfiles
              </CardDescription>
            </div>
            <Button onClick={handleCreateUpgrade} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Upgrade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UpgradesList onEdit={handleEditUpgrade} />
        </CardContent>
      </Card>

      {/* Modals */}
      {state.isCreateModalOpen && (
        <UpgradeForm
          isOpen={state.isCreateModalOpen}
          onClose={handleCloseModals}
          upgrade={null}
          mode="create"
        />
      )}

      {state.isEditModalOpen && state.selectedUpgrade && (
        <UpgradeForm
          isOpen={state.isEditModalOpen}
          onClose={handleCloseModals}
          upgrade={state.selectedUpgrade}
          mode="edit"
        />
      )}
    </div>
  );
}