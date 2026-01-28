import AdminProtection from "@/components/AdminProtection";
import DashboardLayout from "@/modules/dashboard/components/DashbLayout";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel De Admin - PrepagoYa',
  description: 'Panel de administración para gestionar usuarios, perfiles y contenido.',
};

export default function Dashboard() {
  return (
    <AdminProtection>
      <DashboardLayout />
    </AdminProtection>
  );
}