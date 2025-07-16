'use client';

import { Badge } from '@/components/ui/badge';
import AccountContent from '@/modules/account/components/AccountContent';
import AccountProgressBar from '@/modules/account/components/AccountProgressBar';
import AccountSidebar from '@/modules/account/components/AccountSidebar'; // si es exclusivo de account
import { useAccountSection } from '@/modules/account/hooks/useAccountSection';
import { useState } from 'react';
import AccountVerification from './AccountVerification';
import { useSession } from "next-auth/react"


export default function AccountLayout() {
    const { data: session, status } = useSession()
    const { activeSection, setActiveSection } = useAccountSection();
    const accountCompleteness = 65;
    const [verificationStatus, setVerificationStatus] = useState({
        verified: (session?.user as { isVerified?: boolean })?.isVerified ?? false, // Cambiar a true para simular usuario verificado
        verification_in_progress: (session?.user as { verification_in_progress?: boolean })?.verification_in_progress ?? false, // Cambiar a true para simular verificación en progreso
    })


    if (!verificationStatus.verified) {
        return <AccountVerification verificationStatus={verificationStatus} setVerificationStatus={setVerificationStatus} />
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
            <AccountProgressBar percentage={accountCompleteness} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
                <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
                    🟢 NICOLAS ALVAREZ
                </Badge>
            </div> */}
        </div>
    );
}
