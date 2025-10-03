'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, ChevronRight } from 'lucide-react';
import { sidebarItems } from '@/modules/dashboard/data';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    onOverlayChange?: (isOpen: boolean) => void;
}

export function AdminSidebar({
    activeSection,
    setActiveSection,
    onOverlayChange
}: AdminSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        onOverlayChange?.(newState);
    };

    const handleItemClick = (itemId: string) => {
        setActiveSection(itemId);
        // Cerrar el sidebar después de seleccionar cualquier item
        setIsOpen(false);
        onOverlayChange?.(false);
    };

    return (
        <div className=''>
            {/* Botón de toggle - visible solo cuando el sidebar está cerrado */}
            <Button
                onClick={toggleSidebar}
                variant="outline"
                size="icon"
                className={cn(
                    "fixed top-20 right-2 z-50 bg-white dark:bg-slate-800 border-2 shadow-lg transition-all duration-300 hover:scale-105",
                    isOpen ? "opacity-0 pointer-events-none scale-95" : "opacity-100 pointer-events-auto scale-100 border-gray-200 dark:border-slate-600"
                )}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Sidebar superpuesto - posicionado debajo del header */}
            <div
                className={cn(
                    "fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-slate-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header del sidebar */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Panel de Admin
                        </h2>
                        <Button
                            onClick={toggleSidebar}
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Contenido del sidebar - ajustado para el nuevo posicionamiento */}
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
                                                {item.description && (
                                                    <p className={cn(
                                                        "text-xs mt-1 transition-colors duration-200",
                                                        activeSection === item.id
                                                            ? 'text-white/80'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                    )}>
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {item.badge && (
                                                <Badge
                                                    variant={activeSection === item.id ? 'secondary' : 'default'}
                                                    className={cn(
                                                        "text-xs transition-colors duration-200",
                                                        activeSection === item.id
                                                            ? 'bg-white/20 text-white border-white/30'
                                                            : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100'
                                                    )}
                                                >
                                                    {item.badge}
                                                </Badge>
                                            )}
                                            <ChevronRight
                                                className={cn(
                                                    "h-4 w-4 transition-all duration-200",
                                                    activeSection === item.id
                                                        ? 'text-white rotate-90'
                                                        : 'text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1'
                                                )}
                                            />
                                        </div>
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer del sidebar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Panel de Administración
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Online Escorts v2.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}