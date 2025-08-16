import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authUser, updateUserLastLogin, getUserById } from "@/services/user.service";

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
        } catch (error) {
          // Error obteniendo datos del usuario, mantener los datos del token
          console.error('Error fetching updated user data:', error);
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
      return session;
    },
    async redirect() {
      return '/'; // 🔁 redirección global después del login
    },
  },
})