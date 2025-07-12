import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AccountSettings = () => {
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
                value="Nicolas Alvarez"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
              />
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Email
              </span>
              <p className="text-foreground">tecnologico03@gmail.com</p>
            </div>
            <div>
              <label
                htmlFor="accountType"
                className="text-sm font-medium text-muted-foreground"
              >
                Tipo de cuenta
              </label>
              <input
                id="accountType"
                type="text"
                className="text-foreground bg-transparent border-none p-0 m-0 focus:ring-0"
                value="Agencia"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
              />
            </div>
            <Button
              variant="outline"
              className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
            >
              Editar Información
            </Button>
          </CardContent>
        </Card>
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
              <p className="text-foreground font-semibold">Premium Plus</p>
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
