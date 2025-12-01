'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import { sidebarItems } from '@/modules/dashboard/data';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    isOpen: boolean; // NUEVO: Recibe el estado del padre
    onToggle: () => void; // NUEVO: Función para abrir/cerrar
}

export function AdminSidebar({
    activeSection,
    setActiveSection,
    isOpen,
    onToggle
}: AdminSidebarProps) {
    // ELIMINADO: const [isOpen, setIsOpen] = useState(false);
    // Ya no controlamos el estado aquí adentro

    const handleItemClick = (itemId: string) => {
        setActiveSection(itemId);
        // Si quieres que se cierre al dar click en un item:
        if (isOpen) onToggle();
    };

    return (
        <div className=''>
            {/* ELIMINADO: El div del Overlay interno, ya que usas AdminOverlay en el layout */}

            {/* Botón de toggle (burbuja flotante) */}
            <Button
                onClick={onToggle} // Usa la función del padre
                variant="outline"
                size="icon"
                className={cn(
                    "fixed top-1/2 -translate-y-1/2 left-2 z-50 bg-white dark:bg-slate-800 border-2 shadow-lg transition-all duration-300 hover:scale-105 rounded-full",
                    isOpen
                        ? "opacity-0 pointer-events-none scale-95"
                        : "opacity-100 pointer-events-auto scale-100 border-gray-200 dark:border-slate-600"
                )}
            >
                <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-slate-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full" // Obedece al prop isOpen
                )}
            >
                {/* Header del sidebar */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Panel de Admin
                        </h2>
                        <Button
                            onClick={onToggle} // Usa la función del padre
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Contenido ... (El resto sigue igual, solo asegúrate de usar handleItemClick actualizado arriba) */}
                <div className="p-4 h-[calc(100%-8rem)] overflow-y-auto">
                    <Card className="bg-transparent border-none shadow-none">
                        <CardContent className="p-0">
                            <nav className="space-y-2">
                                {sidebarItems.map((item, index) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => handleItemClick(item.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 group animate-in slide-in-from-left-2",
                                            activeSection === item.id
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-700/50'
                                        )}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <item.icon
                                                className={cn(
                                                    "h-5 w-5 transition-colors duration-200",
                                                    activeSection === item.id
                                                        ? 'text-white'
                                                        : 'text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                                                )}
                                            />
                                            <div className="flex-1">
                                                <span className="font-medium text-sm">{item.label}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </div>
                {/* Footer del sidebar (igual que antes) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Panel de Administración</p>
                    </div>
                </div>
            </div>
        </div>
    );
}