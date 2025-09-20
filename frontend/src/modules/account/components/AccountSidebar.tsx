import { ShieldCheck, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-user';
import { sidebarItems } from '../data';
import AccountVerificationModal from './AccountVerificationModal';

const AccountSidebar = ({
  activeSection,
  setActiveSection,
  onCouponRedeem,
}: {
  activeSection: string;
  setActiveSection: (id: string) => void;
  onCouponRedeem?: (couponCode: string) => void;
}) => {
  const { data: user } = useUser();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);

  const handleCouponRedeem = async () => {
    if (!couponCode.trim()) return;
    
    setIsRedeemingCoupon(true);
    try {
      if (onCouponRedeem) {
        await onCouponRedeem(couponCode.trim().toUpperCase());
      }
    } finally {
      setIsRedeemingCoupon(false);
      setCouponCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCouponRedeem();
    }
  };

  return (
    <div className="w-80 space-y-2 animate-in slide-in-from-left-4 duration-500">
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

          {/* Sección de Canjear Cupón */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center space-x-2 mb-3">
              <Ticket className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                Canjear Cupón
              </h3>
            </div>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ingresa tu código"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400"
                disabled={isRedeemingCoupon}
                maxLength={50}
              />
              <Button
                onClick={handleCouponRedeem}
                disabled={!couponCode.trim() || isRedeemingCoupon}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isRedeemingCoupon ? 'Validando...' : 'Canjear'}
              </Button>
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
