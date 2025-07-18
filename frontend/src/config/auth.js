import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authUser } from "@/services/user.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider === 'google') {
        // Llama al backend para crear/obtener usuario
        const userData = await authUser({ email: user.email, name: user.name });
        // Puedes guardar datos extra en el token si lo necesitas
        token.userId = userData._id;
        token.isVerified = userData.isVerified; // opcional
        token.verification_in_progress = userData.verification_in_progress;
      }
      return token;
    },
    async session({ session, token }) {
      // Agrega los datos del usuario a la sesión
      session.user._id = token.userId;
      session.user.isVerified = token.isVerified;
      session.user.verification_in_progress = token.verification_in_progress;
      return session;
    },
    async redirect({ url, baseUrl }) {
      return '/'; // 🔁 redirección global después del login
    },
  },
})