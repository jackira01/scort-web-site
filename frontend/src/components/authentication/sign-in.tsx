"use client"

import { signIn, signOut } from "next-auth/react"
import { Button } from "../ui/button"

export default function Login() {
  return (
    <Button
      onClick={() => signIn("google")}
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