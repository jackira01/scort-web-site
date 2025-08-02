'use client';

import Loader from '@/components/Loader';
import { useUser } from '@/hooks/use-user';
import AccountContent from '@/modules/account/components/AccountContent';
import AccountProgressBar from '@/modules/account/components/AccountProgressBar';
import AccountSidebar from '@/modules/account/components/AccountSidebar'; // si es exclusivo de account
import { useAccountSection } from '@/modules/account/hooks/useAccountSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useState } from 'react';

export default function AccountLayout() {
    const { activeSection, setActiveSection } = useAccountSection();
    const { data: user, isLoading } = useUser();
    const [showInfoAlert, setShowInfoAlert] = useState(true);

    const accountCompleteness = 65;

    if (isLoading || !user) {
        return <Loader />;
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
            <AccountProgressBar percentage={accountCompleteness} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Alertas de verificación */}
                <div className="mb-6 space-y-4">
                    {/* Alerta cuando el usuario está verificado pero los perfiles no son públicos */}
                    {!user.isVerified && (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-amber-800 dark:text-amber-200">
                                Tus perfiles no estarán públicos hasta que verifiques tu cuenta.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Alerta informativa dismissible */}
                    {showInfoAlert && (
                        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 relative">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <AlertDescription className="text-blue-800 dark:text-blue-200 pr-8">
                                Una vez verificados los perfiles, estos serán públicos.
                            </AlertDescription>
                            <button
                                onClick={() => setShowInfoAlert(false)}
                                className="absolute top-2 right-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                aria-label="Cerrar alerta"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Alert>
                    )}
                </div>
                
                <div className="flex gap-8">
                    <AccountSidebar
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    />
                    <div className="flex-1">
                        <AccountContent activeSection={activeSection} />
                    </div>
                </div>
            </div>
        </div>
    );
}
