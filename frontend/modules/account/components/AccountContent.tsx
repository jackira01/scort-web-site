'use client';

import ProfileList from '@/modules/account/components/ProfileList';
import PaymentHistory from '@/modules/payments/components/PaymentHistory';
import AccountSettings from '@/modules/settings/components/AccountSettings';
import { paymentHistoryData, userProfiles } from '@/utils/MockedData';
import {
  getProgressColor,
  getProgressTextColor,
} from '../utils/getProgressColor';

type Props = {
  activeSection: string;
};

export default function AccountContent({ activeSection }: Props) {
  if (activeSection === 'perfiles') {
    return (
      <ProfileList
        profiles={userProfiles}
        getProgressColor={getProgressColor}
        getProgressTextColor={getProgressTextColor}
      />
    );
  }

  if (activeSection === 'pagos') {
    return <PaymentHistory payments={paymentHistoryData} />;
  }

  if (activeSection === 'ajustes') {
    return <AccountSettings />;
  }

  return null;
}
