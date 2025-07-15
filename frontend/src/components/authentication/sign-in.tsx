"use client"

import { signIn, signOut } from "next-auth/react"
 
export default function Login() {
  return <button onClick={() => signIn("google")}>SignIn</button>
}

export function SignOut() {
  return <button onClick={() => signOut()}>Sign Out</button>
}