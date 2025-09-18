'use client';

import AccountProfiles from './AccountProfiles';
import PaymentHistory from '@/modules/payments/components/PaymentHistory';
import AccountSettings from '@/modules/settings/components/AccountSettings';
import NewsBoard from './NewsBoard';
import CouponSection from '@/components/account/coupons/CouponSection';
import {
  getProgressColor,
  getProgressTextColor,
} from '../utils/getProgressColor';
import { useUser } from '@/hooks/use-user';
import { useUserProfiles } from '@/hooks/use-user-profiles';
import Loader from '@/components/Loader';

type Props = {
  activeSection: string;
};

export default function AccountContent({ activeSection }: Props) {
  const { data: user } = useUser();
  const { data: profiles, isLoading, error } = useUserProfiles(user?._id);

  if (activeSection === 'perfiles') {
    if (isLoading) {
      return <Loader />;
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Error al cargar los perfiles</p>
        </div>
      );
    }

    return (
      <AccountProfiles
        profiles={profiles || []}
        getProgressColor={getProgressColor}
        getProgressTextColor={getProgressTextColor}
      />
    );
  }

  if (activeSection === 'pagos') {
    return <PaymentHistory />;
  }

  if (activeSection === 'grupos-atributos') {
        return <AccountSettings />;
    }

  if (activeSection === 'tablero-noticias') {
    return <NewsBoard />;
  }

  // Sección de cupones temporalmente deshabilitada
  // if (activeSection === 'cupones') {
  //   return <CouponSection />;
  // }

  return null;
}
