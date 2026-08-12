import {
    login,
  } from "./actions";
  
  type LoginPageProps = {
    searchParams: Promise<{
      error?: string;
    }>;
  };
  
  export default async function LoginPage({
    searchParams,
  }: LoginPageProps) {
    const params =
      await searchParams;
  
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-500">
              Kay POS Platform
            </p>
  
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Business Login
            </h1>
  
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with your cloud POS account.
            </p>
          </div>
  
          {params.error && (
            <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {params.error}
            </p>
          )}
  
          <form
            action={login}
            className="space-y-5"
          >
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Email address
              </span>
  
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition focus:border-orange-500"
                placeholder="owner@example.com"
              />
            </label>
  
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Password
              </span>
  
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition focus:border-orange-500"
                placeholder="••••••••"
              />
            </label>
  
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 px-5 py-4 text-lg font-black text-white transition hover:bg-orange-600"
            >
              Sign in
            </button>
          </form>
  
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Access is limited to accounts linked to an active business.
          </p>
        </section>
      </main>
    );
  }