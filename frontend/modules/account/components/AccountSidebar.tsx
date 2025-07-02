import { Card, CardContent } from '@/components/ui/card';

import { sidebarItems } from '../data';

const AccountSidebar = ({
  activeSection,
  setActiveSection,
}: {
  activeSection: string;
  setActiveSection: (id: string) => void;
}) => {
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group animate-in slide-in-from-left-2 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <item.icon
                  className={`h-5 w-5 ${activeSection === item.id ? 'text-white' : 'group-hover:text-purple-600'} transition-colors duration-200`}
                />
                <div className="flex-1">
                  <span className="font-medium">{item.label}</span>
                  <p
                    className={`text-xs mt-1 ${
                      activeSection === item.id
                        ? 'text-white/80'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSidebar;
