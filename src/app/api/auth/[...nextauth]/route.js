import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("NextAuth signIn callback - user:", user);
      console.log("NextAuth signIn callback - account:", account);
      
      await connectDB();

      let existingUser = await User.findOne({ email: user.email });
      console.log("NextAuth signIn callback - existingUser:", existingUser);

      if (!existingUser) {
        // Create new user
        const newUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account.provider,
        });
        console.log("NextAuth signIn callback - newUser created:", newUser);
        user.userId = newUser._id.toString();
        user._id = newUser._id.toString();
      } else {
        // Update existing user with latest info
        existingUser.name = user.name;
        existingUser.image = user.image;
        await existingUser.save();
        console.log("NextAuth signIn callback - existingUser updated:", existingUser);
        user.userId = existingUser._id.toString();
        user._id = existingUser._id.toString();
      }

      console.log("NextAuth signIn callback - final user object:", user);
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("NextAuth jwt callback - token:", token);
      console.log("NextAuth jwt callback - user:", user);
      console.log("NextAuth jwt callback - account:", account);
      
      if (user) {
        token.userId = user.userId;
        token._id = user._id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.provider = account?.provider;
        console.log("NextAuth jwt callback - updated token:", token);
      }
      return token;
    },
    async session({ session, token }) {
      console.log("NextAuth session callback - session:", session);
      console.log("NextAuth session callback - token:", token);
      
      if (token) {
        session.user.id = token.userId;
        session.user._id = token._id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.provider = token.provider;
        
        // Create a custom JWT token for the frontend
        const customToken = jwt.sign(
          {
            userId: token.userId,
            _id: token._id,
            name: token.name,
            email: token.email,
            image: token.image,
            provider: token.provider,
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        session.customToken = customToken;
        console.log("NextAuth session callback - final session:", session);
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
