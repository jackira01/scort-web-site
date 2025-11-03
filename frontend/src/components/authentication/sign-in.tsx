"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { broadcastLogout } from "@/hooks/use-auth-sync"

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
      // Usar broadcastLogout que notifica a todas las pestañas
      await broadcastLogout("/");
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
    // Usar broadcastLogout que notifica a todas las pestañas
    await broadcastLogout("/");
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};