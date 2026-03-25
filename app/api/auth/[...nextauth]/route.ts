import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb/client";
import { Profile } from "@/lib/mongodb/models";
import dbConnect from "@/lib/mongodb/mongoose";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT to make session available without db lookups if needed, or stick to database
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;

        // Ensure user has a profile record
        try {
          await dbConnect();
          const p = await Profile.findOne({ userId: token.sub });
          if (!p) {
            await Profile.create({
              userId: token.sub,
              username: session.user.name,
              full_name: session.user.name,
              avatar_url: session.user.image,
              onboarding_completed: false,
            });
          }
        } catch (err) {
          console.error("Error creating profile in session callback:", err);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
