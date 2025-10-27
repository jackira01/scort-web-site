'use client';

import { ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';
import { sidebarItems } from '../data';
import AccountVerificationModal from './AccountVerificationModal';

interface AccountMenuContentProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const AccountMenuContent = ({
  activeSection,
  setActiveSection,
  isVisible,
  onClose,
  isMobile,
}: AccountMenuContentProps) => {
  const { data: user } = useUser();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const menuVariants = {
    hidden: {
      x: isMobile ? -320 : 0,
      opacity: 0, // 👈 siempre empieza en 0 para evitar desfasajes
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "tween",   // 👈 importante, evita el "spring"
        ease: "easeInOut",  // 👈 velocidad constante (o prueba "easeInOut" si quieres más natural)
        duration: 0.4,
      },
    },
    exit: {
      x: isMobile ? 320 : 0,
      opacity: isMobile ? 0 : 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (isMobile && !isVisible) return null;

  return (
    <motion.div
      variants={isMobile ? menuVariants : undefined}
      initial={isMobile ? "hidden" : undefined}
      animate={isMobile ? "visible" : undefined}
      exit={isMobile ? "exit" : undefined}
      className={`${isMobile
        ? 'fixed left-0 top-0 h-full w-80 z-40 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto md:hidden'
        : 'w-80 space-y-2 animate-in slide-in-from-left-4 duration-500'
        }`}
    >
      {isMobile && (
        <div className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-10 w-10 border-2 border-purple-500/20">
              <AvatarImage
                src={"/placeholder.svg?height=40&width=40"}
                alt={user?.name || "Usuario"}
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 font-semibold">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{user?.name?.toUpperCase() || 'USUARIO'}</h2>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'user' ? 'Usuario' : 'Agencia'} • {user?.email || 'email@ejemplo.com'}
              </p>
            </div>
          </div>


          {/* Botón de Verificación/Administración de Datos */}
          <div className="mb-6">
            <Button
              className={`w-full font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] ${user?.isVerified
                ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white'
                : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white'
                }`}
              onClick={() => setIsVerificationModalOpen(true)}
            >
              <ShieldCheck className="h-5 w-5 mr-2" />
              {user?.isVerified ? 'Administrar Verificación' : 'Verificar Cuenta'}
            </Button>
          </div>

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
    </motion.div>
  );
};

export default AccountMenuContent;
