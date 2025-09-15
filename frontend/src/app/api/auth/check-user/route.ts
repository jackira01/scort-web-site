import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/account-linking';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const existingUser = await findUserByEmail(email);

    return NextResponse.json({
      exists: !!existingUser,
      user: existingUser ? {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        hasPassword: existingUser.hasPassword,
        providers: existingUser.providers,
      } : null,
    });

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}