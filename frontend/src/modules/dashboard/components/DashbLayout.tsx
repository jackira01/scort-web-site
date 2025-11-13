'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttributeGroupsAdmin } from '@/modules/dashboard/components/AttributeGroupsAdmin';
import { DashUserPanel } from '@/modules/dashboard/components/DashbUserPanel';
import ConfigManager from '@/components/admin/ConfigManager/ConfigManager';
import PlansManager from '@/components/admin/plans/PlansManager';
import BlogsManager from '@/components/admin/blogs/BlogsManager';
import NewsManager from '@/components/admin/news/NewsManager';
import CouponsManager from '@/components/admin/coupons/CouponsManager';
import LocationsManager from '@/components/admin/locations/LocationsManager';
import EmailManager from '@/components/admin/emails/EmailManager';
import ContentPagesManager from '@/components/admin/content/ContentPagesManager';
import ContentEditor from '@/components/admin/content/ContentEditor';
import ProfileFormTipsManager from '@/components/admin/content/ProfileFormTipsManager';
import { AdminSidebar } from '@/modules/dashboard/components/AdminSidebar';
import { AdminOverlay } from '@/modules/dashboard/components/AdminOverlay';
import { DashProfilePanel } from './DashbProfilePanel';
import InvoicesManager from '@/components/admin/invoices/InvoicesManager';


export default function DashboardLayout() {
    const [activeSection, setActiveSection] = useState('usuarios');
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            const section = searchParams.get('section');
            if (section) {
                setActiveSection(section);
            }
        }
    }, [searchParams, mounted]);

    const handleSidebarOverlayChange = (isOpen: boolean) => {
        setSidebarOpen(isOpen);
    };

    // Evitar hidratación mismatch
    if (!mounted) {
        return null;
    }


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

            case 'blogs':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <BlogsManager />
                    </div>
                );

            case 'noticias':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <NewsManager />
                    </div>
                );

            case 'contenido':
                const editSlug = searchParams.get('edit');
                const subSection = searchParams.get('sub');

                if (editSlug) {
                    return (
                        <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                            <ContentEditor
                                pageSlug={editSlug}
                                onBack={() => {
                                    window.location.href = '/adminboard?section=contenido';
                                }}
                            />
                        </div>
                    );
                }

                if (subSection === 'tips-formulario') {
                    return (
                        <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                            <ProfileFormTipsManager />
                        </div>
                    );
                }

                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <ContentPagesManager />
                    </div>
                );

            case 'cupones':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <CouponsManager />
                    </div>
                );

            case 'localidades':
                return (
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
                        <LocationsManager />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* AdminSidebar superpuesto */}
            <AdminSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onOverlayChange={handleSidebarOverlayChange}
            />

            {/* Contenido principal con overlay */}
            <AdminOverlay
                isVisible={sidebarOpen}
                onClick={() => setSidebarOpen(false)}
            >
                <main className="pt-5 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-in fade-in-0 duration-500">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </AdminOverlay>
        </div>
    );
}
