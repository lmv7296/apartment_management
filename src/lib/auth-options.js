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

        const { rows } = await query(
          `
            SELECT u.id, u.company_id, u.name, u.email, u.role, u.unit_id, u.password_hash,
                   c.name AS company_name
            FROM users u
            LEFT JOIN companies c ON c.id = u.company_id
            WHERE LOWER(u.email) = LOWER($1)
              AND u.active = TRUE
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
          company_name: user.company_name || null,
          unit_id: user.unit_id,
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
