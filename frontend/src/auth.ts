import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth } = NextAuth({
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
            password: hashedPassword,
            hasPassword: true,
            provider: "credentials"
          };
        } catch (error) {
          console.error("Error en authorize:", error);
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
          console.log('🔍 [FRONTEND-AUTH] Iniciando callback de Google signIn');
          console.log('🔍 [FRONTEND-AUTH] Datos del usuario Google:', {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          });

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });

          console.log('🔍 [FRONTEND-AUTH] Respuesta del backend recibida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          const result = await response.json();
          
          console.log('🔍 [FRONTEND-AUTH] Datos parseados del backend:', {
            success: result.success,
            message: result.message,
            action: result.action,
            userId: result.userId,
            userEmail: result.userEmail,
            userPassword: result.userPassword === null ? 'null' : (result.userPassword ? `[${typeof result.userPassword}] ${result.userPassword.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined'),
            actionReason: result.actionReason
          });
          
          if (!result.success) {
            console.error('❌ [FRONTEND-AUTH] Google login failed:', result.message);
            return false;
          }
          
          console.log('🔍 [FRONTEND-AUTH] Actualizando objeto user con datos del backend...');
          // Actualizar datos del usuario con la información de la BD
          user.id = result.userId;
          (user as any).isVerified = true; // Los usuarios de Google están verificados
          (user as any).verification_in_progress = false;
          (user as any).role = 'user'; // Rol por defecto
          (user as any).password = result.userPassword; // Agregar password al token
          (user as any).action = result.action; // 'login' o 'post_register'
          
          console.log('🔍 [FRONTEND-AUTH] Usuario actualizado:', {
            id: user.id,
            email: user.email,
            isVerified: (user as any).isVerified,
            role: (user as any).role,
            password: (user as any).password === null ? 'null' : ((user as any).password ? `[${typeof (user as any).password}] ${(user as any).password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined'),
            action: (user as any).action
          });
          
          console.log('✅ [FRONTEND-AUTH] Callback de Google signIn completado exitosamente');
          return true;
        } catch (error) {
          console.error('❌ [FRONTEND-AUTH] Error in Google signIn callback:', error);
          return false;
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account }) {
      console.log('🔍 [FRONTEND-AUTH] JWT Callback iniciado');
      console.log('🔍 [FRONTEND-AUTH] JWT - Parámetros recibidos:', {
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        tokenUserId: token.userId,
        tokenEmail: token.email
      });
      
      // Primera vez que se crea el token
      if (user) {
        console.log('🔍 [FRONTEND-AUTH] JWT - Primera creación del token con usuario:', {
          userId: user.id,
          email: user.email,
          name: user.name,
          isVerified: (user as any).isVerified,
          role: (user as any).role,
          password: (user as any).password ? `[${typeof (user as any).password}] ${(user as any).password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
          action: (user as any).action
        });
        
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.isVerified = (user as any).isVerified;
        token.verification_in_progress = (user as any).verification_in_progress;
        token.role = (user as any).role;
        token.password = (user as any).password; // Agregar password al token JWT
        token.action = (user as any).action;
        
        console.log('🔍 [FRONTEND-AUTH] JWT - Token actualizado:', {
          userId: token.userId,
          email: token.email,
          password: token.password ? `[${typeof token.password}] ${token.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
          action: token.action
        });
      }
      
      // Agregar información del provider
      if (account) {
        token.provider = account.provider;
        console.log('🔍 [FRONTEND-AUTH] JWT - Provider agregado:', account.provider);
      }
      
      console.log('🔍 [FRONTEND-AUTH] JWT - Token final:', {
        userId: token.userId,
        email: token.email,
        provider: token.provider,
        password: token.password ? `[${typeof token.password}] ${token.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
        action: token.action
      });
      
      return token;
    },
    
    async session({ session, token }) {
      console.log('🔍 [FRONTEND-AUTH] Session Callback iniciado');
      console.log('🔍 [FRONTEND-AUTH] Session - Token recibido:', {
        userId: token.userId,
        email: token.email,
        provider: token.provider,
        password: token.password ? `[${typeof token.password}] ${token.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
        action: token.action
      });
      
      // Exponer información necesaria en la sesión
      if (token) {
        (session.user as any)._id = token.userId;
        (session.user as any).provider = token.provider;
        (session.user as any).isVerified = token.isVerified;
        (session.user as any).verification_in_progress = token.verification_in_progress;
        (session.user as any).role = token.role;
        (session.user as any).password = token.password; // Exponer password en sesión
        (session.user as any).action = token.action;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      
      console.log('🔍 [FRONTEND-AUTH] Session - Sesión actualizada:', {
        userId: (session.user as any)._id,
        email: session.user?.email,
        provider: (session.user as any).provider,
        password: (session.user as any).password ? `[${typeof (session.user as any).password}] ${(session.user as any).password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
        action: (session.user as any).action
      });
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Manejar redirecciones de forma segura
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Permitir redirecciones al mismo dominio
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Redirección por defecto
      return baseUrl;
    },
  },

  // Eventos para logging y debugging
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      if (isNewUser) {
        console.log(`New user created: ${user.email}`);
      }
    },
    async signOut(params) {
      const token = 'token' in params ? params.token : null;
      console.log(`User signed out: ${token?.email}`);
    },
  },

  // Configuración de debug para desarrollo
  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.NEXTAUTH_SECRET,
});