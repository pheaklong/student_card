import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
  KeyRound,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { SchoolSettings, AppUser } from '../types';
import { login } from '../lib/auth';
import { MoEYSEmblem } from './CambodianEmblems';

interface LoginViewProps {
  school: SchoolSettings;
  onLoginSuccess: (user: AppUser) => void;
  onOpenPublicDigitalCard?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  school,
  onLoginSuccess,
  onOpenPublicDigitalCard,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(username, password, rememberMe);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'ការចូលប្រើប្រព័ន្ធមិនជោគជ័យ សូមពិនិត្យព័ត៌មានម្តងទៀត');
      }
    } catch (err: any) {
      setError(err?.message || 'មានបញ្ហាបច្ចេកទេសក្នុងការចូលប្រើ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-sky-50 to-blue-100 flex flex-col justify-center items-center p-4 sm:p-6 font-kantumruy">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-neutral-200/80 p-6 sm:p-8">
          
          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 shadow-xs mb-3">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={school.school_name}
                  className="w-14 h-14 object-contain"
                />
              ) : (
                <MoEYSEmblem size={56} />
              )}
            </div>

            <div className="space-y-1">
              <h2 className="font-muol text-sm sm:text-base text-blue-950">
                {school.school_name || 'វិទ្យាល័យ តាំងក្រូច'}
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                ប្រព័ន្ធគ្រប់គ្រង និងបោះពុម្ពប័ណ្ណសម្គាល់ខ្លួនសិស្ស
              </p>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>តំបន់សុវត្ថិភាព ៖ តម្រូវឱ្យ Login</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-snug">
                <span className="font-bold">បរាជ័យ៖ </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                ឈ្មោះគណនី (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                ពាក្យសម្ងាត់ (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md border-neutral-300 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span>ចងចាំការចូលប្រើលើម៉ាស៊ីននេះ</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-linear-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ចូលប្រើប្រព័ន្ធ (Log In)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Helper for Demo / First Time */}
          <div className="mt-5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>គណនីដើមសម្រាប់ប្រើប្រាស់ (Default Admin)</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>បំពេញភ្លាម</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono bg-white p-2 rounded-lg border border-neutral-200">
              <div>
                <span>User: </span>
                <span className="font-bold text-neutral-800">admin</span>
              </div>
              <div>
                <span>Pass: </span>
                <span className="font-bold text-neutral-800">admin123</span>
              </div>
            </div>
          </div>

          {/* Public Digital Card Bypass Link */}
          {onOpenPublicDigitalCard && (
            <div className="mt-4 pt-4 border-t border-neutral-200/80 text-center">
              <p className="text-[11px] text-neutral-500 mb-2">
                តើអ្នកគ្រាន់តែចង់ស្កេន ឬផ្ទៀងផ្ទាត់ប័ណ្ណសិស្សមែនទេ?
              </p>
              <button
                type="button"
                onClick={onOpenPublicDigitalCard}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>បើកមើលប័ណ្ណឌីជីថល (Digital Card Public - មិនបាច់ Login)</span>
              </button>
            </div>
          )}

        </div>

        {/* Security Notice Footer */}
        <div className="mt-4 text-center text-[11px] text-neutral-400">
          <p>© {new Date().getFullYear()} {school.school_name} · ប្រព័ន្ធការពារសុវត្ថិភាពទិន្នន័យ</p>
        </div>
      </div>
    </div>
  );
};
