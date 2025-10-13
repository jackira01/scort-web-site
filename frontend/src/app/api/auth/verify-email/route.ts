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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Código de verificación requerido' },
        { status: 400 }
      );
    }

    // Llamar al backend para verificar el código
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.user.email,
        code: code.trim(),
      }),
    });

    const data = await backendResponse.json();

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'Email verificado exitosamente',
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Código de verificación inválido' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}