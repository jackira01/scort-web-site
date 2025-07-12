import { Badge } from '@/components/ui/badge';

const FooterBadge = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
        🟢 NICOLAS ALVAREZ
      </Badge>
    </div>
  );
};
export default FooterBadge;
