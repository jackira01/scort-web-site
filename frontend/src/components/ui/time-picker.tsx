'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  minTime?: string; // ✅ Tiempo mínimo permitido (formato HH:MM)
  maxTime?: string; // ✅ Tiempo máximo permitido (formato HH:MM)
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Seleccionar hora",
  minTime,
  maxTime
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // ✅ Función para verificar si un tiempo es válido según min/max
  const isTimeDisabled = (hour: string, minute: string = '00'): boolean => {
    const currentTime = `${hour}:${minute}`;
    const currentMinutes = parseInt(hour) * 60 + parseInt(minute);

    if (minTime) {
      const [minH, minM] = minTime.split(':').map(Number);
      const minMinutes = minH * 60 + minM;
      if (currentMinutes <= minMinutes) return true;
    }

    if (maxTime) {
      const [maxH, maxM] = maxTime.split(':').map(Number);
      const maxMinutes = maxH * 60 + maxM;
      if (currentMinutes >= maxMinutes) return true;
    }

    return false;
  };

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '');
      setSelectedMinute(minute || '');
    }
  }, [value]);

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    const newTime = `${hour}:${selectedMinute || '00'}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    const newTime = `${selectedHour || '00'}:${minute}`;
    onChange(newTime);
  };

  const formatDisplayTime = () => {
    if (!selectedHour && !selectedMinute) return placeholder;
    const hour = selectedHour || '00';
    const minute = selectedMinute || '00';
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn(!selectedHour && !selectedMinute && "text-muted-foreground")}>
            {formatDisplayTime()}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar selector"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Columna de horas */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Hora
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {hours.map((hour) => {
                  const disabled = isTimeDisabled(hour, selectedMinute || '00');
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => !disabled && handleHourSelect(hour)}
                      disabled={disabled}
                      className={cn(
                        "w-full px-2 py-1 text-sm rounded text-left transition-colors",
                        selectedHour === hour && "bg-accent text-accent-foreground",
                        disabled
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columna de minutos */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Minutos
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {minutes.map((minute) => {
                  const disabled = isTimeDisabled(selectedHour || '00', minute);
                  return (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => !disabled && handleMinuteSelect(minute)}
                      disabled={disabled}
                      className={cn(
                        "w-full px-2 py-1 text-sm rounded text-left transition-colors",
                        selectedMinute === minute && "bg-accent text-accent-foreground",
                        disabled
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
