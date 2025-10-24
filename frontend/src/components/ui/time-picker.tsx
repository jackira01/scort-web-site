'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Seleccionar hora"
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '');
      setSelectedMinute(minute || '');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detectar vista móvil para ajustar el dropdown (mejor UX en pantallas pequeñas)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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

      {isOpen && !disabled && (
        <>
          {/* Overlay para móviles para capturar clics y evitar desbordes */}
          {isMobile && (
            <div
              className="fixed inset-0 z-40 sm:hidden bg-black/30"
              onClick={() => setIsOpen(false)}
            />
          )}
          <div
            ref={dropdownRef}
            className={cn(
              // Desktop: dropdown anclado
              "sm:absolute sm:left-0 sm:mt-1 sm:w-80 sm:rounded-md sm:border sm:bg-popover sm:p-3 sm:text-popover-foreground sm:shadow-md sm:animate-in sm:fade-in-0 sm:zoom-in-95 sm:z-50",
              // Mobile: panel fijo inferior, centrado y con scroll
              "fixed inset-x-4 bottom-6 z-50 sm:static sm:inset-auto",
              "rounded-md border bg-popover p-3 text-popover-foreground shadow-lg",
              "max-h-[70vh] overflow-y-auto"
            )}
          >
            {/* Botón "X" para cerrar */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="max-h-48 sm:max-h-32 overflow-y-auto space-y-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleHourSelect(hour)}
                      className={cn(
                        "w-full px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground text-left",
                        selectedHour === hour && "bg-accent text-accent-foreground"
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columna de minutos */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Minutos
                </div>
                <div className="max-h-56 sm:max-h-40 overflow-y-auto space-y-1">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleMinuteSelect(minute)}
                      className={cn(
                        "w-full px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground text-left",
                        selectedMinute === minute && "bg-accent text-accent-foreground"
                      )}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
