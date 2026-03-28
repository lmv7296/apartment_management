"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useEffect } from "react";
import { APP_ROUTES } from "@/config/routes";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(APP_ROUTES.dashboard);
    }
  }, [router, status]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/Dashboard");
  }

  return (
    <main className='mx-auto max-w-md px-6 py-14'>
      <h1 className='text-3xl font-bold mb-2'>Sign in</h1>
      <p className='text-gray-600 mb-8'>
        Use any active email from mock users and the demo password.
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1' htmlFor='email'>
            Email
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className='w-full rounded border border-gray-300 px-3 py-2'
            placeholder='john.doe@example.com'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1' htmlFor='password'>
            Password
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className='w-full rounded border border-gray-300 px-3 py-2'
            placeholder='demo123'
          />
        </div>

        {error ? <p className='text-sm text-red-600'>{error}</p> : null}

        <button
          type='submit'
          disabled={loading}
          className='w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60'>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className='mt-2 text-sm'>
        <Link href='/' className='text-blue-600 underline'>
          Back to home
        </Link>
      </p>
    </main>
  );
}
