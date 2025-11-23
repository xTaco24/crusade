import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Vote, BarChart3, Users, Lock, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={
        `relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ` +
        `shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ` +
        `before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gradient-to-br ` +
        `before:from-blue-500/10 before:via-purple-500/10 before:to-transparent ` +
        `hover:border-white/20 hover:before:from-blue-500/15 hover:before:via-purple-500/15 transition-colors duration-300 ` +
        className
      }
    >
      {children}
    </div>
  );
}

 

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_100%_-20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(800px_400px_at_-10%_10%,rgba(168,85,247,0.12),transparent_60%),#0B1220]">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.6]">
        <div className="absolute -top-40 -right-20 h-[36rem] w-[36rem] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-purple-500/15 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" style={{ backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Navigation */}
      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <GlassCard className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="group inline-flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-sm" />
                <div className="relative rounded-xl bg-white/5 p-2 backdrop-blur">
                  <Rocket className="h-5 w-5 text-blue-300" />
                </div>
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                Crusade <span className="text-blue-400">Voting</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link to="/elections" className="rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white">
                Elecciones
              </Link>
              <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white">
                Ingresar
              </Link>
              <Link
                to="/register"
                className="group ml-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/15"
              >
                Crear cuenta
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </nav>
          </GlassCard>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-14 sm:pb-20 sm:pt-20 md:pt-24">
          <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
            <motion.h1 variants={fadeInUp} className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Democracia digital segura para la
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-purple-400 bg-clip-text text-transparent"> comunidad UNAB</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-lg leading-8 text-gray-300">
              Plataforma moderna, auditada y diseñada para elecciones estudiantiles con resultados en tiempo real, transparencia absoluta y una experiencia impecable.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500"
              >
                Iniciar sesión
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/elections"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-base font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/15"
              >
                Ver elecciones
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeInUp} className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Dominio verificado @uandresbello.edu / @unab.cl
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
                <Lock className="h-3.5 w-3.5 text-blue-300" />
                Voto único, cifrado y auditable
            </div>
            </motion.div>
          </motion.div>

          
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.h2 variants={fadeInUp} className="text-center text-3xl font-bold text-white sm:text-4xl">
              Votación segura, simple y transparente
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-3 max-w-2xl text-center text-gray-300">
              Arquitectura pensada para instituciones: trazabilidad, control de acceso y resultados en vivo.
            </motion.p>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  Icon: Shield,
                  title: 'Seguridad de grado institucional',
                  description: 'Autenticación robusta, cifrado de votos y auditoría completa.',
                },
                {
                  Icon: Vote,
                  title: 'Experiencia de voto impecable',
                  description: 'Interfaz clara, pasos guiados y confirmación con comprobante.',
                },
                {
                  Icon: BarChart3,
                  title: 'Resultados en tiempo real',
                  description: 'Monitoreo de participación y conteo en vivo durante la elección.',
                },
                {
                  Icon: Users,
                  title: 'Accesible y responsivo',
                  description: 'Disponible 24/7 desde cualquier dispositivo y tamaño de pantalla.',
                },
              ].map(({ Icon, title, description }) => (
                <motion.div key={title} variants={fadeInUp}>
                  <GlassCard className="h-full p-6 transition-all hover:scale-[1.01]">
                    <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/10 p-3 text-blue-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm text-gray-300">{description}</p>
                  </GlassCard>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 pb-12 sm:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.h2 variants={fadeInUp} className="text-center text-3xl font-bold text-white sm:text-4xl">
              ¿Cómo funciona?
            </motion.h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                { step: '1', title: 'Autentícate', desc: 'Ingresa con tu correo institucional verificado.' },
                { step: '2', title: 'Vota una sola vez', desc: 'Selecciona tu preferencia y confirma con seguridad.' },
                { step: '3', title: 'Sigue resultados', desc: 'Observa participación y conteo en tiempo real.' },
              ].map((item) => (
                <motion.div key={item.step} variants={fadeInUp}>
                  <GlassCard className="p-6">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-sm font-bold text-blue-200">
                      {item.step}
                    </div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-300">{item.desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
      </div>
      </section>

      

      {/* Final CTA */}
      <section className="relative z-10 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <GlassCard className="relative overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_80%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl font-bold text-white sm:text-3xl">Participa en la democracia estudiantil</h3>
              <p className="mt-2 text-gray-300">Tu voz importa. Súmate al sistema de votación digital más avanzado de Chile.</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500"
                >
                  Comenzar ahora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/elections"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-base font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/15"
                >
                  Ver elecciones
            </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pb-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Crusade Voting — Universidad Andrés Bello
      </div>
      </footer>
    </div>
  );
}