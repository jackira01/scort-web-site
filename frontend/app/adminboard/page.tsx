import { Metadata } from 'next';
import AdminProtection from "@/components/AdminProtection";
import DashboardLayout from "@/modules/dashboard/components/DashbLayout";

export const metadata: Metadata = {
  title: 'Panel De Admin - Online Escorts',
  description: 'Panel de administración para gestionar usuarios, perfiles y contenido.',
};

export default function Dashboard() {
  return (
    <AdminProtection>
      <DashboardLayout />
    </AdminProtection>
  );
}