'use client';

import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeRangePicker } from '@mui/x-date-pickers-pro/TimeRangePicker';
import { DateRange } from '@mui/x-date-pickers-pro/models';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    timeRange: DateRange<Dayjs>;
  }>>(
    daysOfWeek.reduce((acc, day) => {
      const existingDay = availability.find(a => a.dayOfWeek === day);
      const hasSlots = existingDay && existingDay.slots.length > 0;
      
      acc[day] = {
        isAvailable: hasSlots,
        timeRange: hasSlots ? [
          dayjs().hour(parseInt(existingDay.slots[0].start.split(':')[0])).minute(parseInt(existingDay.slots[0].start.split(':')[1])),
          dayjs().hour(parseInt(existingDay.slots[0].end.split(':')[0])).minute(parseInt(existingDay.slots[0].end.split(':')[1]))
        ] : [
          dayjs().hour(9).minute(0),
          dayjs().hour(17).minute(0)
        ]
      };
      return acc;
    }, {} as Record<string, { isAvailable: boolean; timeRange: DateRange<Dayjs> }>)
  );

  const updateAvailability = () => {
    const newAvailability = daysOfWeek
      .filter(day => dayStates[day].isAvailable)
      .map(day => {
        const timeRange = dayStates[day].timeRange;
        const start = timeRange[0];
        const end = timeRange[1];

        return {
          dayOfWeek: day,
          slots: [{
            start: start && start.isValid() ? start.format('HH:mm') : '09:00',
            end: end && end.isValid() ? end.format('HH:mm') : '17:00',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }]
        };
      });

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

  const handleTimeRangeChange = (day: string, newValue: DateRange<Dayjs>) => {
    setDayStates(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeRange: newValue
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
