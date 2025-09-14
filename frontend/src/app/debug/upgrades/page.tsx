import UpgradeDebugPanel from '@/components/debug/UpgradeDebugPanel';

export default function UpgradeDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug - Sistema de Upgrades</h1>
      <UpgradeDebugPanel />
    </div>
  );
}