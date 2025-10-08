import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Llamar al backend para reenviar el código
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.user.email,
      }),
    });

    const data = await backendResponse.json();

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'Código de verificación reenviado',
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Error al reenviar el código' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error resending verification code:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}