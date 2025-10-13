import { Metadata } from 'next';
import AccountLayout from "@/modules/account/components/AccountLayout";

export const metadata: Metadata = {
  title: 'Cuenta - Online Escorts',
  description: 'Gestiona tu cuenta, perfiles y configuraciones en Online Escorts.',
};

export default function AccountPage() {
  return (
    <AccountLayout />
  );
}
