'use client';

import { Badge } from '@/components/ui/badge';
import AccountContent from '@/modules/account/components/AccountContent';
import AccountHeader from '@/modules/account/components/AccountHeader';
import AccountProgressBar from '@/modules/account/components/AccountProgressBar';
import AccountSidebar from '@/modules/account/components/AccountSidebar'; // si es exclusivo de account
import { useAccountSection } from '@/modules/account/hooks/useAccountSection';
import {
  getProgressColor,
  getProgressTextColor,
} from '@/modules/account/utils/getProgressColor';

export default function AccountPage() {
  const { activeSection, setActiveSection } = useAccountSection();
  const accountCompleteness = 73;

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
          <AccountSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <div className="flex-1">
            <AccountContent activeSection={activeSection} />
          </div>
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
