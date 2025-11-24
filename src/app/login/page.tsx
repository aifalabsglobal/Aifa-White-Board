'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setLoading(false);
            } else {
                router.push('/');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signIn('google', { callbackUrl: '/' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/30">
                        <Image src="/logo.png" alt="AIFA Labs" width={64} height={64} />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome Back</h1>
                    <p className="text-sm text-white/70">
                        Sign in to access your workspaces and collaborate with your team
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="password" className="block text-sm font-medium text-white/80">
                                Password
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-white/60">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.1-1.9 2.7l3.1 2.4c1.8-1.7 2.8-4.2 2.8-7.2 0-.7-.1-1.4-.2-2H12z" />
                        <path fill="#34A853" d="M5.3 14.3L4.6 14l-2.5 1.9c1.3 2.6 4 4.4 7.2 4.4 2.2 0 4.1-.7 5.4-1.9l-3.1-2.4c-.9.6-2 1-3.3 1-2.5 0-4.6-1.7-5.3-4z" />
                        <path fill="#4A90E2" d="M19.5 6.8L16.4 9.2c-.9-.6-2.1-1-3.4-1-3.2 0-6 2.1-6.9 5.1l-.7-.3-2.5-1.9A9.89 9.89 0 0 1 13 2.5c2.4 0 4.6.9 6.3 2.3l.2.2z" />
                        <path fill="#FBBC05" d="M2.1 6.1 4.6 8c.7-2 2.1-3.5 3.9-4.5A9.78 9.78 0 0 1 13 2.5V2c-2.7 0-5.3.8-7.5 2.3C3.9 4.9 2.7 5.4 2.1 6z" />
                    </svg>
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <p className="text-center text-sm text-white/70">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium underline">
                        Sign up
                    </Link>
                </p>

                <p className="text-xs text-center text-white/60">
                    By continuing you agree to the{' '}
                    <a href="/terms" className="underline hover:text-white">Terms</a>{' '}
                    and{' '}
                    <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
                </p>
            </div>
        </main>
    );
}

