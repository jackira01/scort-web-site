import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authUser, updateUserLastLogin, getUserById } from "@/services/user.service";
import axios from "@/lib/axios";

// Función para generar JWT token personalizado
const generateCustomJWT = async (userId, role) => {
  try {
    const response = await axios.post('/api/auth/generate-token', { userId, role });
    return response.data.token;
  } catch (error) {
    return null;
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  trustHost: true, // Permite hosts locales como localhost:3000
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider === 'google') {
        console.log('🔍 [AUTH-JS] Llamando authUser con:', { email: user.email, name: user.name });
        const userData = await authUser({ email: user.email, name: user.name });
        
        console.log('🔍 [AUTH-JS] DATOS COMPLETOS DEVUELTOS POR authUser:', JSON.stringify({
          _id: userData?._id,
          id: userData?.id,
          userId: userData?.userId,
          email: userData?.email,
          name: userData?.name,
          password: userData?.password,
          role: userData?.role,
          isVerified: userData?.isVerified,
          provider: userData?.provider,
          hasPassword: userData?.hasPassword,
          action: userData?.action,
          actionReason: userData?.actionReason
        }, null, 2));
        
        // Guarda datos del usuario en el token
        // Corregir mapeo: authUser devuelve userId, no _id
        token.userId = userData.userId || userData._id || userData.id;
        token.role = userData.role || 'user';
        
        // CRÍTICO: Agregar password y action al token para que el middleware los detecte
        token.password = userData.password || null;
        token.action = userData.action || null;
        
        console.log('🔍 [AUTH-JS] Token actualizado con userData:', {
          tokenUserId: token.userId,
          tokenRole: token.role,
          tokenPassword: token.password,
          tokenAction: token.action,
          userDataUserId: userData.userId,
          userDataId: userData._id,
          userDataPassword: userData.password,
          userDataAction: userData.action
        });

        // Generar JWT token personalizado
        const customJWT = await generateCustomJWT(userData._id, userData.role);
        if (customJWT) {
          token.accessToken = customJWT;
          console.log('🔍 [AUTH-JS] JWT personalizado generado');
        }

        // Actualizar lastLogin del usuario
        try {
          // Actualizar lastLogin solo si tenemos un userId válido
          const userId = userData.userId || userData._id || userData.id;
          if (userId) {
            console.log('🔍 [AUTH-JS] Actualizando lastLogin para userId:', userId);
            await updateUserLastLogin(userId);
            console.log('✅ [AUTH-JS] LastLogin actualizado exitosamente');
          } else {
            console.warn('⚠️ [AUTH-JS] No se pudo obtener userId para actualizar lastLogin:', userData);
          }
        } catch (error) {
          console.error('[AUTH-JS] Error updating lastLogin:', error);
        }
      } else if (token.userId) {
        // Si ya tenemos un userId, obtener los datos más recientes del usuario
        try {
          const userData = await getUserById(token.userId);
          token.role = userData.role;
          // Actualizar otros campos que puedan haber cambiado
          token.isVerified = userData.isVerified;
          token.verification_in_progress = userData.verification_in_progress;

          // Regenerar JWT token si es necesario (opcional)
          if (!token.accessToken) {
            const customJWT = await generateCustomJWT(token.userId, userData.role);
            if (customJWT) {
              token.accessToken = customJWT;
            }
          }
        } catch (error) {
          // Error obteniendo datos del usuario, mantener los datos del token

        }
      }
      return token;
    },
    async session({ session, token }) {
      // Agrega los datos del usuario a la sesión
      session.user._id = token.userId;
      session.user.role = token.role;
      session.user.isVerified = token.isVerified;
      session.user.verification_in_progress = token.verification_in_progress;
      session.accessToken = token.accessToken; // JWT token personalizado
      return session;
    },
    async redirect() {
      return '/'; // 🔁 redirección global después del login
    },
  },
})