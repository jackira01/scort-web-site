'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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

  // Generar opciones de horas (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Generar opciones de minutos (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Inicializar valores desde el prop value
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '');
      setSelectedMinute(minute || '');
    }
  }, [value]);

  // Cerrar dropdown al hacer click fuera
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    
    const formattedTime = `${displayHour}:${minute} ${period}`;
    console.log('TimePicker formatDisplayTime:', { hour, minute, hourNum, displayHour, period, formattedTime });
    
    return formattedTime;
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
        <span className={cn(
          !selectedHour && !selectedMinute && "text-muted-foreground"
        )}>
          {formatDisplayTime()}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-80 rounded-md border bg-popover p-3 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Columna de horas */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Hora
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
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
              <div className="max-h-40 overflow-y-auto space-y-1">
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
      )}
    </div>
  );
}