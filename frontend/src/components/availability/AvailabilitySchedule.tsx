'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilitySlot {
  start: string;
  end: string;
  timezone: string;
}

interface DayAvailability {
  dayOfWeek: string;
  slots: AvailabilitySlot[];
}

interface AvailabilityScheduleProps {
  availability: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
}

const daysOfWeek = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo'
];

const dayLabels = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sábado: 'Sábado',
  domingo: 'Domingo'
};

export function AvailabilitySchedule({ availability, onChange }: AvailabilityScheduleProps) {
  const [dayStates, setDayStates] = useState<Record<string, {
    isAvailable: boolean;
    startTime: string;
    endTime: string;
  }>>(
    daysOfWeek.reduce((acc, day) => {
      const existingDay = availability.find(a => a.dayOfWeek === day);
      const hasSlots = existingDay && existingDay.slots.length > 0;

      acc[day] = {
        isAvailable: hasSlots,
        startTime: hasSlots && existingDay!.slots[0] ? existingDay!.slots[0].start : '09:00',
        endTime: hasSlots && existingDay!.slots[0] ? existingDay!.slots[0].end : '17:00'
      };
      return acc;
    }, {} as Record<string, { isAvailable: boolean; startTime: string; endTime: string }>)
  );

  const updateAvailability = () => {
    const newAvailability = daysOfWeek
      .filter(day => dayStates[day].isAvailable)
      .map(day => ({
        dayOfWeek: day,
        slots: [{
          start: dayStates[day].startTime,
          end: dayStates[day].endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }]
      }));

    onChange(newAvailability);
  };

  const handleCheckboxChange = (day: string, checked: boolean) => {
    setDayStates(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: checked
      }
    }));

    setTimeout(updateAvailability, 0);
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setDayStates(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));

    setTimeout(updateAvailability, 0);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">¿Cuándo podemos encontrarnos?</CardTitle>
      </CardHeader>
      <CardContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="space-y-4">
            {daysOfWeek.map(day => (
              <div key={day} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`available-${day}`}
                    checked={dayStates[day].isAvailable}
                    onCheckedChange={(checked) => handleCheckboxChange(day, !!checked)}
                  />
                  <Label 
                    htmlFor={`available-${day}`}
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    ¿Disponible el {dayLabels[day as keyof typeof dayLabels]}?
                  </Label>
                </div>
                
                <div className="ml-6">
                  <TimeRangePicker
                    value={dayStates[day].timeRange}
                    onChange={(newValue) => handleTimeRangeChange(day, newValue)}
                    disabled={!dayStates[day].isAvailable}
                    slotProps={{
                      textField: {
                        size: 'small',
                        variant: 'outlined'
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </LocalizationProvider>
      </CardContent>
    </Card>
  );
}
