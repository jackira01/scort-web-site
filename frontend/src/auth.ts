import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        try {
          // Usar el endpoint del backend para login
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.message || "Credenciales inválidas");
          }

          // Limpiar intentos fallidos en caso de éxito
          if (req) {
            // TODO: Implementar limpieza de intentos fallidos si es necesario
          }

          return {
            id: result.user._id,
            email: result.user.email,
            name: result.user.name,
            isVerified: result.user.isVerified,
            verification_in_progress: result.user.verification_in_progress,
            role: result.user.role,
            hasPassword: true,
            provider: "credentials"
          };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Error de autenticación");
        }
      },
    }),
  ],

  // Configuración de páginas personalizadas
  pages: {
    signIn: '/autenticacion/ingresar',
    error: '/autenticacion/error',
  },

  // Usar JWT para mejor compatibilidad con Credentials
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Manejar login con Google
      if (account?.provider === 'google') {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/auth_google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: user.id
            })
          });

          const result = await response.json();

          if (!result.success) {
            return false;
          }

          // Actualizar el objeto user con los datos del backend
          user.id = result.user._id;
          user.isVerified = result.user.isVerified;
          user.verification_in_progress = result.user.verification_in_progress;
          user.role = result.user.role;
          user.hasPassword = result.user.hasPassword;

          return true;
        } catch (error) {
          console.error('Error en signIn callback de Google:', error);
          return false;
        }
      }

      return true;
    },
    
    async jwt({ token, user, account }) {
      // Si hay un usuario (primera vez o actualización), actualizar el token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.isVerified = user.isVerified;
        token.verification_in_progress = user.verification_in_progress;
        token.role = user.role;
        token.hasPassword = user.hasPassword;
      }

      // Agregar información del proveedor si está disponible
      if (account?.provider) {
        token.provider = account.provider;
      }

      return token;
    },
    
    async session({ session, token }) {
      // Transferir datos del token a la sesión
      if (token) {
        session.user.id = token.id as string;
        session.user._id = token.id as string; // Agregar _id para compatibilidad
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.verification_in_progress = token.verification_in_progress as boolean;
        session.user.role = token.role as string;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.provider = token.provider as string;
      }

      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Manejar redirecciones de forma segura
      
      // Validar que tenemos valores válidos
      if (!url || !baseUrl) {
        return baseUrl || 'http://localhost:3000';
      }

      // Si la URL es solo la raíz, redirigir al home
      if (url === '/' || url === baseUrl) {
        return baseUrl;
      }

      // Si es una URL relativa, construir la URL completa
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // Si es una URL completa, verificar que sea del mismo dominio
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        } else {
          return baseUrl;
        }
      } catch (error) {
        return baseUrl;
      }
    },
  },

  // Eventos para logging y debugging
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        // Log para nuevos usuarios
      }
    },
    async signOut(params) {
      // Log para sign out
    },
  },

  // Configuración de debug para desarrollo
  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.AUTH_SECRET,
});