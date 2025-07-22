'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sidebarItems } from '@/modules/dashboard/data';
import { DashUserPanel } from './DashbUserPanel';

export default function DashboardLayout() {
    const [activeSection, setActiveSection] = useState('usuarios');


    const renderContent = () => {
        switch (activeSection) {
            case 'usuarios':
                return <DashUserPanel />;

            case 'facturas':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Saldo y Facturas
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-2">Saldo Actual</h3>
                                    <p className="text-3xl font-bold">$2,450.00</p>
                                    <p className="text-sm opacity-90 mt-1">
                                        Disponible para retiro
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-2">Este Mes</h3>
                                    <p className="text-3xl font-bold">$890.00</p>
                                    <p className="text-sm opacity-90 mt-1">Ingresos generados</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-2">Total</h3>
                                    <p className="text-3xl font-bold">$12,340.00</p>
                                    <p className="text-sm opacity-90 mt-1">Ingresos totales</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">
                                    Facturas Recientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                                        >
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Factura #{String(item).padStart(4, '0')}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Servicios de plataforma - Diciembre 2024
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">$125.00</p>
                                                <Badge variant="outline" className="text-xs">
                                                    Pagado
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'ajustes':
                return {
                    /* <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                      Ajustes
                                  </h1>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <Card className="bg-card border-border">
                                          <CardHeader>
                                              <CardTitle className="text-foreground">
                                                  Información Personal
                                              </CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                              <div>
                                                  <label className="text-sm font-medium text-muted-foreground">
                                                      Nombre completo
                                                  </label>
                                                  <p className="text-foreground">Nicolas Alvarez</p>
                                              </div>
                                              <div>
                                                  <label className="text-sm font-medium text-muted-foreground">
                                                      Email
                                                  </label>
                                                  <p className="text-foreground">nicolas@example.com</p>
                                              </div>
                                              <div>
                                                  <label className="text-sm font-medium text-muted-foreground">
                                                      Teléfono
                                                  </label>
                                                  <p className="text-foreground">+57 300 123 4567</p>
                                              </div>
                                              <Button
                                                  variant="outline"
                                                  className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
                                              >
                                                  Editar Información
                                              </Button>
                                          </CardContent>
                                      </Card>
          
                                      <Card className="bg-card border-border">
                                          <CardHeader>
                                              <CardTitle className="text-foreground">Seguridad</CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                  <span className="text-foreground">
                                                      Autenticación de dos factores
                                                  </span>
                                                  <Badge variant="outline" className="text-green-600">
                                                      Activo
                                                  </Badge>
                                              </div>
                                              <div className="flex items-center justify-between">
                                                  <span className="text-foreground">Última sesión</span>
                                                  <span className="text-muted-foreground text-sm">
                                                      Hace 2 horas
                                                  </span>
                                              </div>
                                              <Button
                                                  variant="outline"
                                                  className="w-full hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 transition-all duration-200"
                                              >
                                                  Cambiar Contraseña
                                              </Button>
                                          </CardContent>
                                      </Card>
                                  </div>
                              </div> */
                };

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
            {/* Header */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-80 space-y-2 animate-in slide-in-from-left-4 duration-500">
                        <Card className="bg-card border-border shadow-sm">
                            <CardContent className="p-6">
                                <nav className="space-y-2">
                                    {sidebarItems.map((item, index) => (
                                        <button
                                            type="button"
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group animate-in slide-in-from-left-2 ${activeSection === item.id
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                }`}
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <item.icon
                                                className={`h-5 w-5 ${activeSection === item.id ? 'text-white' : 'group-hover:text-purple-600'} transition-colors duration-200`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{item.label}</span>
                                                    {item.badge && (
                                                        <Badge
                                                            variant={
                                                                activeSection === item.id
                                                                    ? 'secondary'
                                                                    : 'default'
                                                            }
                                                            className={`text-xs ${activeSection === item.id
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100'
                                                                }`}
                                                        >
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p
                                                    className={`text-xs mt-1 ${activeSection === item.id
                                                        ? 'text-white/80'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {item.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">{renderContent()}</div>
                </div>
            </div>


        </div>
    );
}
