import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, Truck, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: '#0e1628' }}
      >
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: '#38bdf8', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: '#38bdf8', transform: 'translate(-30%, 30%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full opacity-[0.02]"
          style={{ background: '#38bdf8', transform: 'translate(-50%, -50%)' }}
        />

        <div className="relative">
          <div className="flex items-center gap-4">
            <img src="/iceman.jpg" alt="Iceman" className="h-14 object-contain rounded-lg" />
            <div>
              <p className="text-white font-bold text-lg leading-tight tracking-tight">
                Iceman Warehousing
              </p>
              <p className="text-slate-400 text-sm leading-tight mt-0.5">& Logistics Pvt. Ltd</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Fleet Management
              <br />
              <span style={{ color: '#38bdf8' }}>Made Simple</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              End-to-end visibility across your fleet — from dispatch to delivery,
              all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Truck,
                title: 'Real-time Fleet Tracking',
                desc: 'Monitor vehicle status, trips, and utilization',
              },
              {
                icon: BarChart3,
                title: 'Profitability Analytics',
                desc: 'Vehicle-wise P&L with cost breakdown',
              },
              {
                icon: Shield,
                title: 'Document Compliance',
                desc: 'Automated alerts for expiring documents',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(56,189,248,0.12)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#38bdf8' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200 leading-tight">{title}</p>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} Iceman Warehousing & Logistics Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/iceman.jpg" alt="Iceman" className="h-10 object-contain rounded-lg" />
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">Iceman Fleet</p>
              <p className="text-gray-400 text-xs leading-tight">Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1.5">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:bg-white transition-all duration-150"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:bg-white transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: loading ? '#0284c7' : '#0369a1' }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background = '#0284c7';
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background = '#0369a1';
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-gray-400 mt-8 leading-relaxed">
            Don't have an account?{' '}
            <span className="font-medium text-gray-600">
              Contact your administrator
            </span>{' '}
            for access.
          </p>
        </div>
      </div>
    </div>
  );
}
