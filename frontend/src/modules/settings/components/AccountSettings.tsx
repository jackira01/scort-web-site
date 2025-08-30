import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Crown, Gem, Shield, Star, Zap } from 'lucide-react';
import AgencyConversionCard from './AgencyConversionCard';

// Tipo para el plan actual
interface CurrentPlan {
  level: number;
  name: string;
  code?: string;
}

const AccountSettings = () => {
  const { data: session } = useSession();
  const user = session?.user;
  
  // Función para obtener información del plan
  const getPlanInfo = (level: number) => {
    switch (level) {
      case 1:
        return { name: 'AMATISTA', icon: <Crown className="h-4 w-4 text-purple-500" />, color: 'text-purple-600' };
      case 2:
        return { name: 'ZAFIRO', icon: <Gem className="h-4 w-4 text-blue-500" />, color: 'text-blue-600' };
      case 3:
        return { name: 'ESMERALDA', icon: <Shield className="h-4 w-4 text-green-500" />, color: 'text-green-600' };
      case 4:
        return { name: 'ORO', icon: <Star className="h-4 w-4 text-orange-500" />, color: 'text-orange-600' };
      case 5:
        return { name: 'DIAMANTE', icon: <Zap className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-600' };
      default:
        return { name: 'BÁSICO', icon: <Zap className="h-4 w-4 text-gray-500" />, color: 'text-gray-600' };
    }
  };
  
  // Temporal: usar datos básicos hasta que se implemente la integración completa con perfiles
  const currentPlan: CurrentPlan | null = null; // user?.profile?.planAssignment?.plan;
  const planInfo = currentPlan ? getPlanInfo(currentPlan.level) : getPlanInfo(0);
  
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <h1 className="text-2xl lg:text-3xl font-bold  bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Ajustes de Cuenta
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-muted-foreground"
              >
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                className="text-foreground bg-transparent border-none p-0 m-0 focus:ring-0"
                value={user?.name || 'Usuario'}
                readOnly
                tabIndex={-1}
                aria-readonly="true"
              />
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Email
              </span>
              <p className="text-foreground">{user?.email || 'No disponible'}</p>
            </div>

            <Button
              variant="outline"
              className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
            >
              Editar Información
            </Button>
          </CardContent>
        </Card>
        
        {/* Componente de conversión a agencia */}
        <AgencyConversionCard user={user} />
        
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">
                Autenticación de dos factores
              </span>
              <Badge variant="outline" className="text-green-600">
                Activo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Última sesión</span>
              <span className="text-muted-foreground text-sm">Hace 1 hora</span>
            </div>
            <Button
              variant="outline"
              className="w-full hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 transition-all duration-200"
            >
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Notificaciones por email</span>
              <Badge variant="outline" className="text-green-600">
                Habilitado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Perfil público</span>
              <Badge variant="outline" className="text-blue-600">
                Visible
              </Badge>
            </div>
            <Button
              variant="outline"
              className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
            >
              Configurar Privacidad
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Plan actual
              </span>
              <div className="flex items-center gap-2 mt-1">
                {planInfo.icon}
                <p className={`font-semibold ${planInfo.color}`}>
                  {currentPlan?.name || planInfo.name}
                </p>
                {/* Temporal: comentado hasta implementar integración completa con perfiles */}
                {/* {user?.profile?.planAssignment?.activeUpgrades?.some(upgrade => upgrade.code === 'IMPULSO') && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    🚀 IMPULSO
                  </Badge>
                )} */}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Próxima facturación
              </span>
              <p className="text-foreground">15 de Enero, 2025</p>
            </div>
            <Button
              variant="outline"
              className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
            >
              Gestionar Suscripción
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
