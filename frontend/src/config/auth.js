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
    console.error('Error generating JWT token:', error);
    return null;
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider === 'google') {
        // Llama al backend para crear/obtener usuario
        const userData = await authUser({ email: user.email, name: user.name });
        // Guarda datos del usuario en el token
        token.userId = userData._id;
        token.role = userData.role;
        
        // Generar JWT token personalizado
        const customJWT = await generateCustomJWT(userData._id, userData.role);
        if (customJWT) {
          token.accessToken = customJWT;
        }
        
        // Actualizar lastLogin del usuario
        try {
          await updateUserLastLogin(userData._id);
        } catch (error) {
          // Error updating lastLogin
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