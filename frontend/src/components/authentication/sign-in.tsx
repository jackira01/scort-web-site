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
  return (
    <Button
      onClick={() => signOut()}
      variant="ghost"
      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
    >
      Cerrar sesion
    </Button>
  )
}