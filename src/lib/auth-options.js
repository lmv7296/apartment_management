import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const DEMO_PASSWORD = process.env.NEXTAUTH_DEMO_PASSWORD || "demo123";

function isValidDemoPassword(inputPassword) {
  const value = String(inputPassword || "").trim();
  const allowed = new Set([String(DEMO_PASSWORD || "").trim(), "demo123"]);
  return allowed.has(value);
}

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { rows } = await query(
          `
            SELECT id,company_id, name, email, role, unit_id, password_hash
            FROM users
            WHERE LOWER(email) = LOWER($1)
              AND active = TRUE
            LIMIT 1
          `,
          [credentials.email],
        );

        const user = rows[0];

        if (!user) {
          return null;
        }

        const hasPasswordHash = Boolean(user.password_hash);
        const isValidPassword = hasPasswordHash
          ? await verifyPassword(user.password_hash, credentials.password)
          : isValidDemoPassword(credentials.password);

        if (!isValidPassword) {
          return null;
        }

        if (!hasPasswordHash) {
          const newHash = await hashPassword(credentials.password);
          await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
            newHash,
            user.id,
          ]);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          unitId: user.unit_id,
        };
      },
    }),
  ],
callbacks: {
  async jwt({ token, user }) {
    // When the user logs in, 'user' contains the data from your DB
    if (user) {
      token.id = user.id;
      token.company_id = user.company_id;
      token.role = user.role;
      token.unit_id = user.unit_id;
    }
    return token;
  },
  async session({ session, token }) {
    // Transfer the data from the token to the session object
    if (session.user) {
      session.user.id = token.id;
      session.user.company_id = token.company_id;
      session.user.role = token.role;
      session.user.unit_id = token.unit_id;
    }
    return session;
  }
},
  pages: {
    signIn: "/Login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
