import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import axios from "@/lib/axios";

// Función para validar formato de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para validar fortaleza de contraseña
function isValidPassword(password: string): boolean {
  // Mínimo 8 caracteres, al menos una letra y un número
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Email, contraseña y nombre son requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validar fortaleza de contraseña
    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          message:
            "La contraseña debe tener al menos 8 caracteres, incluyendo letras y números",
        },
        { status: 400 }
      );
    }

    // Validar longitud del nombre
    if (name.trim().length < 2) {
      return NextResponse.json(
        { message: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    try {
      // Verificar si el usuario ya existe
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const existingUserResponse = await fetch(
        `${API_URL}/api/user/email/${email}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (existingUserResponse.ok) {
        return NextResponse.json(
          { message: "El email ya está registrado" },
          { status: 409 }
        );
      }
    } catch (error) {
      // Si el error es 404, significa que el usuario no existe (esto es lo que queremos)
      // Cualquier otro error lo manejamos más abajo
    }

    // Hashear la contraseña
    const saltRounds = 12; // Usar 12 rounds para mayor seguridad
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario en el backend
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const createUserResponse = await fetch(`${API_URL}/api/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          password: hashedPassword,
          role: "user",
          accountType: "common",
          isVerified: false,
        }),
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        return NextResponse.json(
          { message: errorData.message || "Error al crear usuario" },
          { status: createUserResponse.status }
        );
      }

      const userData = await createUserResponse.json();

      return NextResponse.json(
        {
          success: true,
          message: "Usuario registrado exitosamente",
          userId: userData._id || userData.id,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error al crear usuario en backend:", error);
      return NextResponse.json(
        { message: "Error interno del servidor al crear usuario" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}