'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ExcelReports() {
    const { data: session } = useSession();
    const [downloading, setDownloading] = useState(false);

    const handleDownloadProfiles = async () => {
        if (!session?.user?.accessToken) {
            toast.error('No tienes permisos para realizar esta acción');
            return;
        }

        try {
            setDownloading(true);
            toast.loading('Generando reporte...', { id: 'download-report' });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/profiles`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.user.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al descargar el reporte');
            }

            // Obtener el blob del archivo
            const blob = await response.blob();

            // Crear URL temporal
            const url = window.URL.createObjectURL(blob);

            // Crear elemento link invisible para descargar
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Reporte_Perfiles.xlsx';
            document.body.appendChild(a);
            a.click();

            // Limpiar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Reporte descargado correctamente', { id: 'download-report' });
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Error al descargar el reporte', { id: 'download-report' });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reportes Excel</h2>
                <p className="text-muted-foreground">
                    Descarga datos del sistema en formato Excel para análisis y respaldo.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Base de Datos de Perfiles
                        </CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">Perfiles</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Exporta todos los perfiles registrados con sus datos principales.
                        </p>
                        <Button
                            onClick={handleDownloadProfiles}
                            disabled={downloading}
                            className="w-full"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Excel
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Aquí puedes agregar más tarjetas para otros reportes futuros */}
                <Card className="opacity-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Base de Datos de Usuarios
                        </CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">Usuarios</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Próximamente: Exporta la lista de usuarios registrados.
                        </p>
                        <Button disabled className="w-full" variant="outline">
                            Próximamente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
