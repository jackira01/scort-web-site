import { Receipt, Settings, User, Tags } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const sidebarItems = [
  {
    id: 'perfiles',
    label: 'Mis Perfiles',
    icon: User,
    description: 'Administra y visualiza todos tus perfiles activos.',
  },
  {
    id: 'pagos',
    label: 'Historial de Pagos',
    icon: Receipt,
    description: 'Revisa tu historial completo de transacciones y pagos.',
  },
  {
    id: 'grupos-atributos',
    label: 'Configuración',
    icon: Tags,
    description: 'Configura tu cuenta, privacidad y preferencias.',
  },
];

export default function Sidebar({
  activeSection,
  setActiveSection,
}: {
  activeSection: string;
  setActiveSection: (id: string) => void;
}) {
  return (
    <div className="w-80 space-y-2 animate-in slide-in-from-left-4 duration-500">
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group animate-in slide-in-from-left-2 ${activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <item.icon
                  className={`h-5 w-5 ${activeSection === item.id ? 'text-white' : 'group-hover:text-purple-600'} transition-colors duration-200`}
                />
                <div className="flex-1 relative group">
                  <span className="font-medium">{item.label}</span>

                  {/* Tooltip con descripción que aparece en hover */}
                  <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
