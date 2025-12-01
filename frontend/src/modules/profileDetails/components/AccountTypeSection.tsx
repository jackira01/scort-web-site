'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccountTypeSectionProps {
    accountType?: 'common' | 'agency';
}

export const AccountTypeSection = ({ accountType = 'common' }: AccountTypeSectionProps) => {
    const isAgency = accountType === 'agency';
    const label = isAgency ? 'Perfil de agencia' : 'Perfil individual';
    const description = isAgency
        ? 'Este perfil pertenece a una agencia.'
        : 'Este perfil es de un usuario independiente.';

    return (
        <Card className="bg-card border-border animate-in fade-in duration-500">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{label}</span>

                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {/* SOLUCIÓN AQUÍ:
                                   Agregamos onClick con preventDefault().
                                   Esto hace que si el usuario hace click, el evento se cancele,
                                   evitando que el sistema piense que debe cerrar el tooltip o cambiar el foco.
                                */}
                                <div
                                    className="relative cursor-help"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <AlertCircle className="h-5 w-5 text-primary animate-pulse" />
                                    <span className="sr-only">Información sobre el tipo de cuenta</span>
                                </div>
                            </TooltipTrigger>

                            <TooltipContent
                                className="animate-in fade-in-0 zoom-in-95 duration-200"
                                sideOffset={5}
                            >
                                <p>{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    );
};