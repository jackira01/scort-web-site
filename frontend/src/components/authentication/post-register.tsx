'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PostRegister() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/autenticacion/ingresar');
      return;
    }

    router.replace('/cuenta');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Redirigiendo
          </CardTitle>
          <CardDescription className="text-center">
            El flujo de pre-registro fue eliminado. Te estamos llevando a tu cuenta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Abriendo tu panel de cuenta...</span>
        </CardContent>
      </Card>
    </div>
  );
}