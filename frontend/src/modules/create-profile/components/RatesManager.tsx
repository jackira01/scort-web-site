'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDurationForBackend, getDisplayDuration, parseDuration } from '@/utils/time-format';
import { DollarSign, Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Rate } from '../types';

interface RatesManagerProps {
  rates: Rate[];
  onChange: (rates: Rate[]) => void;
  deposito?: boolean;
  onDepositChange?: (value: boolean) => void;
}

export function RatesManager({ rates, onChange, deposito, onDepositChange }: RatesManagerProps) {
  const [newRate, setNewRate] = useState({
    days: '',
    hours: '',
    minutes: '',
    price: '',
    delivery: false,
  });
  const [showValidationError, setShowValidationError] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const addRate = () => {
    const hasValidTime =
      (newRate.days && parseInt(newRate.days) > 0) ||
      (newRate.hours && parseInt(newRate.hours) > 0) ||
      (newRate.minutes && parseInt(newRate.minutes) > 0);

    if (!newRate.price || !hasValidTime) {
      setShowValidationError(true);
      return;
    }

    const timeForBackend = formatDurationForBackend(
      newRate.days,
      newRate.hours,
      newRate.minutes,
    );
    const priceValue = parseInt(newRate.price.replace(/[^\d]/g, ''));

    if (editingRateId) {
      // Modo edición: actualizar tarifa existente
      const updatedRates = rates.map((rate) =>
        rate.id === editingRateId
          ? {
            ...rate,
            time: timeForBackend,
            price: priceValue,
            delivery: newRate.delivery,
          }
          : rate
      );
      onChange(updatedRates);
      setEditingRateId(null);
    } else {
      // Modo agregar: crear nueva tarifa
      const rate: Rate = {
        id: Date.now().toString(),
        time: timeForBackend,
        price: priceValue,
        delivery: newRate.delivery,
      };
      onChange([...rates, rate]);
    }

    setNewRate({
      days: '',
      hours: '',
      minutes: '',
      price: '',
      delivery: false,
    });
    setShowValidationError(false);
  };

  const removeRate = (id: string) => {
    onChange(rates.filter((rate) => rate.id !== id));
  };

  const editRate = (rate: Rate) => {
    const { days, hours, minutes } = parseDuration(rate.time);
    setNewRate({
      days,
      hours,
      minutes,
      price: rate.price.toString(),
      delivery: rate.delivery,
    });
    setEditingRateId(rate.id);
    setShowValidationError(false);
  };

  const cancelEdit = () => {
    setEditingRateId(null);
    setNewRate({
      days: '',
      hours: '',
      minutes: '',
      price: '',
      delivery: false,
    });
    setShowValidationError(false);
  };

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setNewRate((prev) => ({ ...prev, price: numericValue }));
    if (showValidationError && numericValue) {
      setShowValidationError(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Mis tarifas
        </CardTitle>
        {onDepositChange && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="deposito"
              checked={deposito || false}
              onCheckedChange={(checked) => onDepositChange(checked === true)}
            />
            <Label htmlFor="deposito" className="text-sm font-medium cursor-pointer">
              Pido plata por anticipado
            </Label>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de tarifas existentes */}
        {rates.length > 0 && (
          <div className="space-y-3">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg ${editingRateId === rate.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                  : 'border-border bg-muted/50'
                  }`}
              >
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-medium text-foreground">
                      {getDisplayDuration(rate.time)}
                    </span>

                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      {formatPrice(rate.price)}
                    </span>

                    <span className="font-semibold text-yellow-600">
                      {rate.delivery ? 'Domicilio incluido' : 'Domicilio no incluido'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editRate(rate)}
                    className="h-8 w-8 p-0 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                    title="Editar tarifa"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRate(rate.id)}
                    className="h-8 w-8 p-0"
                    title="Eliminar tarifa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

          </div>
        )}

        {/* Formulario para agregar nueva tarifa */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">
              {editingRateId ? '✏️ Editando tarifa' : 'Agregar nueva tarifa'}
            </h3>
            {editingRateId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancelar edición
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className='flex flex-col min-w-[80px] w-full sm:w-auto'>
              <Label className="text-sm text-muted-foreground">Días</Label>
              <Select
                key={`days-${newRate.days}`}
                value={newRate.days || undefined}
                onValueChange={(value) =>
                  setNewRate((prev) => ({ ...prev, days: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i.toString()} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col min-w-[80px] w-full sm:w-auto'>
              <Label className="text-sm text-muted-foreground">Horas</Label>
              <Select
                key={`hours-${newRate.hours}`}
                value={newRate.hours || undefined}
                onValueChange={(value) =>
                  setNewRate((prev) => ({ ...prev, hours: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i.toString()} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col min-w-[80px] w-full sm:w-auto'>
              <Label className="text-sm text-muted-foreground">Minutos</Label>
              <Select
                key={`minutes-${newRate.minutes}`}
                value={newRate.minutes || undefined}
                onValueChange={(value) =>
                  setNewRate((prev) => ({ ...prev, minutes: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => (
                    <SelectItem key={i.toString()} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col w-full'>
              <Label className="text-sm text-muted-foreground">Precio</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="relative flex-1 w-full sm:max-w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    placeholder="100000"
                    value={
                      newRate.price
                        ? new Intl.NumberFormat('es-CO').format(
                          parseInt(newRate.price),
                        )
                        : ''
                    }
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className={`pl-8 ${showValidationError && !newRate.price ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Checkbox de domicilio */}
                <div className="flex items-center space-x-2 whitespace-nowrap w-full sm:w-auto">
                  <Checkbox
                    id="delivery"
                    checked={newRate.delivery}
                    onCheckedChange={(checked) =>
                      setNewRate((prev) => ({ ...prev, delivery: checked === true }))
                    }
                  />
                  <Label htmlFor="delivery" className="text-sm text-muted-foreground cursor-pointer">
                    Domicilio incluido
                  </Label>
                </div>
              </div>

            </div>
          </div>

          {/* Mensaje de error para tiempo */}
          {showValidationError && !newRate.price && (
            <p className="text-red-500 text-sm mt-1">
              El precio es obligatorio para crear una tarifa
            </p>
          )}
          {showValidationError && !((newRate.days && parseInt(newRate.days) > 0) ||
            (newRate.hours && parseInt(newRate.hours) > 0) ||
            (newRate.minutes && parseInt(newRate.minutes) > 0)) && (
              <p className="text-red-500 text-sm">
                Debes especificar al menos días, horas o minutos mayores a 0 para la tarifa
              </p>
            )}

          <Button
            onClick={addRate}
            className={`w-full ${editingRateId
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-green-600 hover:bg-green-700'
              } text-white`}
          >
            {editingRateId ? (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Actualizar tarifa
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Agregar tarifa
              </>
            )}
          </Button>
        </div>

        {rates.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay tarifas configuradas</p>
            <p className="text-sm text-muted-foreground">
              Agrega tu primera tarifa usando el formulario de arriba
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
