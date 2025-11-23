import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signupSchema } from '../utils/validation';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

interface SignupFormData {
  email: string;
  password: string;
  fullName: string;
  studentId: string; // RUT
}

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        `relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ` +
        `shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ` +
        `before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gradient-to-br ` +
        `before:from-blue-500/10 before:via-purple-500/10 before:to-transparent ` +
        `hover:border-white/20 transition-colors duration-300 ` +
        className
      }
    >
      {children}
    </div>
  );
}

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { user, signUp, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const onSubmit = async (data: SignupFormData) => {
    const success = await signUp(
      data.email,
      data.password,
      data.fullName,
      data.studentId
    );
    if (success) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_600px_at_100%_-20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(800px_400px_at_-10%_10%,rgba(168,85,247,0.12),transparent_60%),#0B1220]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_100%_-20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(800px_400px_at_-10%_10%,rgba(168,85,247,0.12),transparent_60%),#0B1220]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" style={{ backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="pointer-events-none absolute -top-40 -right-20 h-[36rem] w-[36rem] rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-purple-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
          <GlassCard className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-5 flex items-center justify-between">
              <Link to="/" className="group inline-flex items-center gap-2">
                <div className="relative rounded-xl bg-white/5 p-2 backdrop-blur">
                  <Shield className="h-5 w-5 text-blue-300" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-white">
                  Crusade <span className="text-blue-400">Voting</span>
                </span>
              </Link>
              <Link to="/" className="inline-flex items-center text-xs text-gray-400 transition-colors hover:text-white">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Volver
              </Link>
            </div>

            <motion.div variants={fadeInUp} className="text-center">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Crear cuenta</h1>
              <p className="mt-1 text-sm text-gray-300">Únete al sistema de votación digital</p>
            </motion.div>

            <motion.form variants={fadeInUp} className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="fullName" className="sr-only">Nombre Completo</label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Nombre Completo"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none backdrop-blur focus:border-white/20 focus:ring-2 focus:ring-blue-500/40"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email (@uandresbello.edu o @unab.cl)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none backdrop-blur focus:border-white/20 focus:ring-2 focus:ring-blue-500/40"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="studentId" className="sr-only">RUT</label>
                <input
                  {...register('studentId')}
                  type="text"
                  placeholder="RUT (ej: 12345678-9)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none backdrop-blur focus:border-white/20 focus:ring-2 focus:ring-blue-500/40"
                />
                {!errors.studentId && (
                  <p className="mt-1 text-xs text-gray-400">Formato: sin puntos y con guion</p>
                )}
                {errors.studentId && <p className="mt-1 text-sm text-red-400">{errors.studentId.message}</p>}
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-gray-400 outline-none backdrop-blur focus:border-white/20 focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : (<><UserPlus className="h-5 w-5" /> Crear cuenta</>)}
              </button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-blue-300 hover:text-blue-200">¿Ya tienes cuenta? Iniciar sesión</Link>
              </div>
            </motion.form>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
              <p>• Usa un email con dominio @uandresbello.edu o @unab.cl</p>
              <p>• La contraseña debe tener al menos 8 caracteres</p>
              <p>• El ID de estudiante es opcional (8-10 dígitos)</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}