'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Zap } from 'lucide-react';
import { PlanForm } from './PlanForm';
import { PlansList } from './PlansList';
import { UpgradeForm } from './UpgradeForm';
import { UpgradesList } from './UpgradesList';
import { Plan, Upgrade, PlansManagerState } from '@/types/plans';

export const PlansManager: React.FC = () => {
  const [state, setState] = useState<PlansManagerState>({
    activeTab: 'plans',
    selectedPlan: undefined,
    selectedUpgrade: undefined,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
  });

  const handleCreatePlan = () => {
    setState(prev => ({
      ...prev,
      selectedPlan: undefined,
      isCreateModalOpen: true,
    }));
  };

  const handleEditPlan = (plan: Plan) => {
    setState(prev => ({
      ...prev,
      selectedPlan: plan,
      isEditModalOpen: true,
    }));
  };

  const handleCreateUpgrade = () => {
    setState(prev => ({
      ...prev,
      selectedUpgrade: undefined,
      isCreateModalOpen: true,
    }));
  };

  const handleEditUpgrade = (upgrade: Upgrade) => {
    setState(prev => ({
      ...prev,
      selectedUpgrade: upgrade,
      isEditModalOpen: true,
    }));
  };

  const handleCloseModals = () => {
    setState(prev => ({
      ...prev,
      selectedPlan: undefined,
      selectedUpgrade: undefined,
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
    }));
  };

  const handleTabChange = (value: string) => {
    setState(prev => ({
      ...prev,
      activeTab: value as 'plans' | 'upgrades',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Planes</h1>
          <p className="text-muted-foreground">
            Administra los planes de suscripción y upgrades del sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={state.activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Planes de Suscripción
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Upgrades
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Planes de Suscripción</CardTitle>
                  <CardDescription>
                    Gestiona los planes de membresía disponibles para los usuarios
                  </CardDescription>
                </div>
                <Button onClick={handleCreatePlan} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PlansList onEdit={handleEditPlan} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upgrades Tab */}
        <TabsContent value="upgrades" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upgrades</CardTitle>
                  <CardDescription>
                    Gestiona los upgrades temporales disponibles para los usuarios
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {state.isCreateModalOpen && state.activeTab === 'plans' && (
        <PlanForm
          isOpen={state.isCreateModalOpen}
          onClose={handleCloseModals}
          plan={undefined}
          mode="create"
        />
      )}

      {state.isEditModalOpen && state.activeTab === 'plans' && state.selectedPlan && (
        <PlanForm
          isOpen={state.isEditModalOpen}
          onClose={handleCloseModals}
          plan={state.selectedPlan}
          mode="edit"
        />
      )}

      {state.isCreateModalOpen && state.activeTab === 'upgrades' && (
        <UpgradeForm
          isOpen={state.isCreateModalOpen}
          onClose={handleCloseModals}
          upgrade={undefined}
          mode="create"
        />
      )}

      {state.isEditModalOpen && state.activeTab === 'upgrades' && state.selectedUpgrade && (
        <UpgradeForm
          isOpen={state.isEditModalOpen}
          onClose={handleCloseModals}
          upgrade={state.selectedUpgrade}
          mode="edit"
        />
      )}
    </div>
  );
};

export default PlansManager;
