import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

  // CRÍTICO: Configuración explícita de cookies para producción
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 [NEXTAUTH SIGNIN] Callback triggered:', {
        provider: account?.provider,
        userEmail: user?.email,
        hasAccount: !!account,
        timestamp: new Date().toISOString(),
      });

      // Manejar login con Google
      if (account?.provider === 'google') {
        try {
          console.log('🔵 [NEXTAUTH SIGNIN] Processing Google login for:', user.email);

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

          console.log('🔵 [NEXTAUTH SIGNIN] Google auth response:', {
            success: result.success,
            userId: result.user?._id,
            hasPassword: result.user?.hasPassword,
          });

          if (!result.success) {
            console.error('❌ [NEXTAUTH SIGNIN] Google auth failed:', result.message);
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

          console.log('✅ [NEXTAUTH SIGNIN] User object updated:', {
            id: user.id,
            email: user.email,
            hasPassword: user.hasPassword,
          });

          return true;
        } catch (error) {
          console.error('❌ [NEXTAUTH SIGNIN] Error in Google auth:', error);
          return false;
        }
      }

      console.log('✅ [NEXTAUTH SIGNIN] Non-Google signin successful');
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      console.log('🎫 [NEXTAUTH JWT] Callback triggered:', {
        trigger,
        hasUser: !!user,
        hasAccount: !!account,
        tokenId: token?.id,
        userEmail: user?.email || token?.email,
        timestamp: new Date().toISOString(),
      });

      // Solo mantener logs críticos para debugging de producción
      if (user) {
        console.log('👤 [NEXTAUTH JWT] Setting token from user object:', {
          userId: user.id,
          email: user.email,
          hasPassword: user.hasPassword,
          role: user.role,
        });

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

        console.log('✅ [NEXTAUTH JWT] Token updated from user:', {
          tokenId: token.id,
          hasPassword: token.hasPassword,
        });
      }

      // CRÍTICO: Solo actualizar en trigger 'update' explícito, no en cada petición
      if (trigger === 'update' && token.id) {
        console.log('🔄 [NEXTAUTH JWT] Update trigger - fetching fresh user data for:', token.id);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
          const response = await fetch(`${apiUrl}/api/users/${token.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();

            console.log('✅ [NEXTAUTH JWT] Fresh user data fetched:', {
              hasPassword: userData.hasPassword,
              role: userData.role,
              emailVerified: userData.emailVerified,
            });

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
          } else {
            console.error('❌ [NEXTAUTH JWT] Failed to fetch user data:', response.status);
          }
        } catch (error) {
          console.error('❌ [NEXTAUTH JWT] Error fetching user data:', error);
        }
      }

      if (account?.provider) {
        token.provider = account.provider;
      }

      console.log('🎫 [NEXTAUTH JWT] Token state after processing:', {
        id: token.id,
        email: token.email,
        hasPassword: token.hasPassword,
        role: token.role,
      });

      return token;
    },

    async session({ session, token }) {
      console.log('👤 [NEXTAUTH SESSION] Callback triggered:', {
        hasToken: !!token,
        tokenId: token?.id,
        sessionEmail: session?.user?.email,
        timestamp: new Date().toISOString(),
      });

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

        console.log('✅ [NEXTAUTH SESSION] Session populated:', {
          userId: session.user.id,
          email: session.user.email,
          hasPassword: session.user.hasPassword,
          role: session.user.role,
        });
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log('🔀 [NEXTAUTH REDIRECT] Redirect callback:', {
        url,
        baseUrl,
        finalRedirect: `${baseUrl}/`,
      });

      // Siempre redirigir a / después del login exitoso
      return `${baseUrl}/`;
    },
  },

  // Eventos para logging y debugging
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('✅ [NEXTAUTH EVENT] SignIn event:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString(),
      });

      if (isNewUser) {
        console.log('🆕 [NEXTAUTH EVENT] New user created:', user.email);
      }
    },
    async signOut(params) {
      console.log('👋 [NEXTAUTH EVENT] SignOut event:', {
        timestamp: new Date().toISOString(),
      });
    },
    async session({ session, token }) {
      console.log('🔄 [NEXTAUTH EVENT] Session event:', {
        userId: session?.user?.id,
        email: session?.user?.email,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Configuración de debug para desarrollo
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
});