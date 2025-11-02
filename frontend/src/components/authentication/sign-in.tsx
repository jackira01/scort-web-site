"use client"

import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"

export default function Login() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/autenticacion/ingresar")}
      variant="ghost"
      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
    >
      Iniciar sesion
    </Button>
  )

}

export function SignOut() {
  const handleSignOut = async () => {
    try {
      // Disparar evento personalizado antes de cerrar sesión
      // Esto notifica a otras pestañas que se va a cerrar sesión
      if (typeof window !== 'undefined') {
        localStorage.setItem('nextauth.message', JSON.stringify({
          event: 'session',
          data: null,
          timestamp: Date.now()
        }));

        // Limpiar inmediatamente para que otras pestañas puedan detectar el cambio
        setTimeout(() => {
          localStorage.removeItem('nextauth.message');
        }, 100);
      }

      // Ejecutar signOut de NextAuth
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
    >
      Cerrar sesion
    </Button>
  )
}

// Versión del manejador para usar directamente en DropdownMenuItem
export const handleSignOut = async () => {
  try {
    // Disparar evento personalizado antes de cerrar sesión
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextauth.message', JSON.stringify({
        event: 'session',
        data: null,
        timestamp: Date.now()
      }));

      setTimeout(() => {
        localStorage.removeItem('nextauth.message');
      }, 100);
    }

    // Ejecutar signOut de NextAuth
    await signOut({ callbackUrl: "/" });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};