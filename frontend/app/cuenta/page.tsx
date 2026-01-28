import AccountLayout from "@/modules/account/components/AccountLayout";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cuenta - PrepagoYa',
  description: 'Gestiona tu cuenta, perfiles y configuraciones en PrepagoYa.',
};

export default function AccountPage() {
  return (
    <AccountLayout />
  );
}
