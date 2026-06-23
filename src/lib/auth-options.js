import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const DEMO_PASSWORD = process.env.NEXTAUTH_DEMO_PASSWORD || "demo123";

async function getActiveUserById(userId) {
  const { rows } = await query(
    `
      SELECT u.id, u.company_id, u.name, u.email, u.role, u.unit_id,
             c.name AS company_name
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.id = $1
        AND u.active = TRUE
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] || null;
}

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

        try {
          const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();
          if (!data?.user) {
            return null;
          }

          const { user } = data;
          return {
            id: user.id,
            email: user.email,
            name: user.profile?.name || user.email,
            role: user.profile?.role || "tenant",
            company_id: user.profile?.company_id || null,
            company_name: null,
            unit_id: user.profile?.unit_id || null,
          };
        } catch (error) {
          console.error("NextAuth authorize backend error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When the user logs in, 'user' contains the data from your DB
      if (user) {
        token.id = user.id;
        token.company_id = user.company_id;
        token.company_name = user.company_name;
        token.role = user.role;
        token.unit_id = user.unit_id;
        token.db_valid = true;
      }

      if (!token?.id) {
        return token;
      }

      try {
        const dbUser = await getActiveUserById(token.id);

        if (!dbUser) {
          delete token.id;
          delete token.name;
          delete token.email;
          delete token.company_id;
          delete token.company_name;
          delete token.role;
          delete token.unit_id;
          token.db_valid = false;
          return token;
        }

        token.id = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.company_id = dbUser.company_id;
        token.company_name = dbUser.company_name;
        token.role = dbUser.role;
        token.unit_id = dbUser.unit_id;
        token.db_valid = true;
      } catch {
        delete token.id;
        delete token.name;
        delete token.email;
        delete token.company_id;
        delete token.company_name;
        delete token.role;
        delete token.unit_id;
        token.db_valid = false;
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.db_valid || !token?.id) {
        return {
          ...session,
          user: undefined,
        };
      }

      // Transfer the data from the token to the session object
      if (session.user) {
        session.user.id = token.id;
        session.user.company_id = token.company_id;
        session.user.company_name = token.company_name;
        session.user.role = token.role;
        session.user.unit_id = token.unit_id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/Login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
