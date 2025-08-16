import AdminProtection from "@/components/AdminProtection";
import DashboardLayout from "@/modules/dashboard/components/DashbLayout";

export default function Dashboard() {
  return (
    <AdminProtection>
      <DashboardLayout />
    </AdminProtection>
  );
}