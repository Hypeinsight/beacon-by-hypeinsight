import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/overview');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Beacon glow background effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo/Header */}
        <div className="text-center">
          {/* Beacon icon/logo */}
          <div className="flex justify-center mb-4">
            <div className="text-5xl font-bold">
              <span className="text-cyan-400">●</span>
              <span className="text-green-400 ml-1">▬</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-green-400 tracking-wider">Beacon</h1>
          <p className="mt-2 text-cyan-300 text-sm font-medium">by Hype Insight</p>
          <h2 className="mt-8 text-2xl font-bold text-white">Sign in to your account</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 placeholder-gray-500 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 placeholder-gray-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-slate-900 bg-gradient-to-r from-cyan-400 to-green-400 hover:from-cyan-300 hover:to-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-green-400 hover:text-cyan-400 transition">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
