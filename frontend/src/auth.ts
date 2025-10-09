import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
            emailVerified: result.user.emailVerified,
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
          user._id = result.user._id;
          user.isVerified = result.user.isVerified;
          user.verification_in_progress = result.user.verification_in_progress;
          user.role = result.user.role;
          user.hasPassword = result.user.hasPassword;
          user.emailVerified = result.user.emailVerified;

          return true;
        } catch (error) {
          // Mantener solo logs de error críticos
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Solo mantener logs críticos para debugging de producción
      if (user) {
        token.id = user.id || '';
        token._id = user._id || user.id || '';
        token.email = user.email || '';
        token.name = user.name || '';
        token.image = user.image || '';
        token.isVerified = user.isVerified;
        token.verification_in_progress = user.verification_in_progress;
        token.role = user.role;
        token.hasPassword = user.hasPassword;
        token.emailVerified = user.emailVerified;
        token.profileId = user.profileId;
        token.profileStatus = user.profileStatus;
        token.profileVerificationStatus = user.profileVerificationStatus;
        token.isHighlighted = user.isHighlighted;
        token.highlightedUntil = user.highlightedUntil;
      }

      // CRÍTICO: Solo actualizar en trigger 'update' explícito, no en cada petición
      if (trigger === 'update' && token.id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${token.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();

            token.hasPassword = userData.hasPassword;
            token.isVerified = userData.isVerified;
            token.verification_in_progress = userData.verification_in_progress;
            token.role = userData.role;
            token.emailVerified = userData.emailVerified;
            token.profileId = userData.profileId;
            token.profileStatus = userData.profileStatus;
            token.profileVerificationStatus = userData.profileVerificationStatus;
            token.isHighlighted = userData.isHighlighted;
            token.highlightedUntil = userData.highlightedUntil;
          }
        } catch (error) {
          // Error crítico en actualización de sesión
        }
      }

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
        session.user.role = token.role as 'admin' | 'user' | 'guest';
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.provider = token.provider as string;
        session.user.profileId = token.profileId as string;
        session.user.profileStatus = token.profileStatus as string;
        session.user.profileVerificationStatus = token.profileVerificationStatus as string;
        session.user.isHighlighted = token.isHighlighted as boolean;
        session.user.highlightedUntil = token.highlightedUntil as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Siempre redirigir a / después del login exitoso
      return `${baseUrl}/`;
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