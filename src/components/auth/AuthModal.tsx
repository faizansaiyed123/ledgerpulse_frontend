import React, { useState } from 'react';
import { FileText, Sparkles, AlertCircle, ArrowRight, Shield, User, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsDemo, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      onClose();
    } catch {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    clearError();
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = (role: 'owner' | 'accountant' | 'staff') => {
    signInAsDemo(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign in to LedgerPulse' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Access your invoice workspace & expenses'
              : 'Start your 14-day free trial. No credit card required.'}
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Demo Exploration:
            </span>
            <span className="text-[10px] text-blue-700 bg-white/80 px-2 py-0.5 rounded-full font-semibold">1-Click</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleDemo('owner')}
              className="py-1.5 px-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white font-medium text-slate-700 shadow-sm border border-slate-200 transition-colors text-center"
            >
              👑 Owner
            </button>
            <button
              type="button"
              onClick={() => handleDemo('accountant')}
              className="py-1.5 px-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white font-medium text-slate-700 shadow-sm border border-slate-200 transition-colors text-center"
            >
              📊 Accountant
            </button>
            <button
              type="button"
              onClick={() => handleDemo('staff')}
              className="py-1.5 px-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white font-medium text-slate-700 shadow-sm border border-slate-200 transition-colors text-center"
            >
              💼 Staff
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-xs text-slate-700 shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">or with work email</span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>{mode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  clearError();
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearError();
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
