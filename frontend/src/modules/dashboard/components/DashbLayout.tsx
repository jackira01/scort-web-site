'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AttributeGroupsAdmin from './AttributeGroupsAdmin';
import { sidebarItems } from '@/modules/dashboard/data';
import { DashUserPanel } from './DashbUserPanel';
import { DashProfilePanel } from './DashbProfilePanel';
import ConfigManager from '@/components/admin/ConfigManager/ConfigManager';
import PlansManager from '@/components/admin/plans/PlansManager';
import DefaultPlanManager from '@/components/admin/DefaultPlanManager';
import BlogsManager from '@/components/admin/blogs/BlogsManager';
import InvoicesManager from '@/components/admin/invoices/InvoicesManager';
import EmailManager from '@/components/admin/emails/EmailManager';


export default function DashboardLayout() {
    const [activeSection, setActiveSection] = useState('usuarios');
    const searchParams = useSearchParams();

    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setActiveSection(section);
        }
    }, [searchParams]);


    const renderContent = () => {
        switch (activeSection) {
            case 'usuarios':
                return <DashUserPanel />;

            case 'perfiles':
                return <DashProfilePanel />;

            case 'facturas':
                return <InvoicesManager />;

            case 'grupos-atributos':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <AttributeGroupsAdmin />
                    </div>
                );

            case 'envio-correos':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <EmailManager />
                    </div>
                );

            case 'configuracion':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <ConfigManager />
                    </div>
                );

            case 'planes':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <PlansManager />
                    </div>
                );

            case 'plan-defecto':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <DefaultPlanManager />
                    </div>
                );

            case 'blogs':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <BlogsManager />
                    </div>
                );

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
                                                    {/* {item.badge && (
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
                                                    )} */}
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
