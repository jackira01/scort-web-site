import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
import { sidebarItems } from '../data';
import AccountVerificationModal from './AccountVerificationModal';

const AccountSidebar = ({
  activeSection,
  setActiveSection,
}: {
  activeSection: string;
  setActiveSection: (id: string) => void;
}) => {
  const { data: user } = useUser();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  return (
    <div className="w-80 space-y-2 animate-in slide-in-from-left-4 duration-500">
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-10 w-10 border-2 border-purple-500/20">
              <AvatarImage
                src="/placeholder.svg?height=40&width=40"
                alt="Nicolas Alvarez"
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 font-semibold">
                NA
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">NICOLAS ALVAREZ</h2>
              <p className="text-xs text-muted-foreground">
                Agencia • tecnologico03@gmail.com
              </p>
            </div>
          </div>

          {/* Botón de Verificar Cuenta - Solo mostrar si no está verificado */}
          {!user?.isVerified && (
            <div className="mb-6">
              <Button
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                onClick={() => setIsVerificationModalOpen(true)}
              >
                <ShieldCheck className="h-5 w-5 mr-2" />
                Verificar Cuenta
              </Button>
            </div>
          )}

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

      {/* Modal de verificación */}
      {user && (
        <AccountVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          verification_in_progress={user.verification_in_progress || false}
          userId={user._id || ''}
        />
      )}
    </div>
  );
};

export default AccountSidebar;
