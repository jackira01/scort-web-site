'use client';

import { useState } from 'react';
import AccountHeader from '@/components/account/AccountHeader';
import AccountProgressBar from '@/components/account/AccountProgressBar';
import AccountSettings from '@/components/account/AccountSettings';
import PaymentHistory from '@/components/account/PaymentHistory';
import ProfileList from '@/components/account/ProfileList';
import Sidebar from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
import { paymentHistory, userProfiles } from '@/utils/MockedData';

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState('perfiles');
  const [accountCompleteness] = useState(73); // Porcentaje de completitud de la cuenta

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-orange-500';
    return 'bg-green-500';
  };
  const getProgressTextColor = (percentage: number) => {
    if (percentage < 50) return 'text-red-600 dark:text-red-400';
    if (percentage < 80) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  let content = null;
  if (activeSection === 'perfiles') {
    content = (
      <ProfileList
        profiles={userProfiles}
        getProgressColor={getProgressColor}
        getProgressTextColor={getProgressTextColor}
      />
    );
  } else if (activeSection === 'pagos') {
    content = <PaymentHistory payments={paymentHistory} />;
  } else if (activeSection === 'ajustes') {
    content = <AccountSettings />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      <AccountHeader />
      <AccountProgressBar
        percentage={accountCompleteness}
        getProgressColor={getProgressColor}
        getProgressTextColor={getProgressTextColor}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <div className="flex-1">{content}</div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
          🟢 NICOLAS ALVAREZ
        </Badge>
      </div>
    </div>
  );
}
