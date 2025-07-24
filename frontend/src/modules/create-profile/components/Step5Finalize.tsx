'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormData } from '../types';
import { upgradeOptions } from '../data';

interface Step5FinalizeProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
}

export function Step5Finalize({ formData, onChange }: Step5FinalizeProps) {
  const handleUpgradeToggle = (upgradeId: string) => {
    const selectedUpgrades = formData.selectedUpgrades.includes(upgradeId)
      ? formData.selectedUpgrades.filter((u) => u !== upgradeId)
      : [...formData.selectedUpgrades, upgradeId];
    
    onChange({ selectedUpgrades });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          05
        </div>
        <h2 className="text-2xl font-bold text-foreground">Finalizar</h2>
      </div>

      <div className="space-y-6">
        {/* Upgrade Options */}
        <div>
          <Label className="text-foreground text-lg font-semibold mb-4 block">
            Actualizaciones
          </Label>
          <div className="space-y-4">
            {upgradeOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 ${formData.selectedUpgrades.includes(option.id)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                    : 'hover:border-purple-300'
                  }`}
                onClick={() => handleUpgradeToggle(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.selectedUpgrades.includes(option.id)}
                        onChange={() => handleUpgradeToggle(option.id)}
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{option.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {option.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        ${option.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Creado</span>
                <p className="text-foreground font-medium">Justo ahora</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Fecha de caducidad
                </span>
                <p className="text-foreground font-medium">Nunca</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Puntos de vista
                </span>
                <p className="text-foreground font-medium">0</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estado</span>
                <p className="text-foreground font-medium">
                  Aprobación pendiente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <div className="space-y-4">
          <Label className="text-foreground text-lg font-semibold">
            Términos & Condiciones
          </Label>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => onChange({ acceptTerms: !!checked })}
            />
            <Label
              htmlFor="terms"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              I accept the website{' '}
              <Link
                href="/terms"
                className="text-blue-600 hover:underline"
              >
                terms & conditions
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline"
              >
                privacy policy
              </Link>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
