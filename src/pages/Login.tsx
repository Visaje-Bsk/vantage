import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', nombre: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      toast({
        title: "Error de autenticación",
        description: error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : "Error al iniciar sesión",
        variant: "destructive",
      });
    } else {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.nombre);
    if (error) {
      toast({
        title: "Error de registro",
        description: error.message === "User already registered"
          ? "El usuario ya está registrado"
          : "Error al crear la cuenta",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cuenta creada",
        description: "Contacta al administrador para activar tu cuenta",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — formulario */}
      <div className="flex flex-col justify-center w-full max-w-md px-10 py-12 bg-background">
        {/* Logo + nombre */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-foreground" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 7.5 9l3 3 4.5-6L19.5 12" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Vantage</span>
          </div>
          <p className="text-xs text-muted-foreground">Sistema de gestión de órdenes</p>
        </div>

        {/* Título dinámico */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {tab === 'login' ? 'Bienvenido' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tab === 'login'
              ? 'Ingresa tus credenciales para continuar'
              : 'Completa el formulario para registrarte'}
          </p>
        </div>

        {/* Formulario login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@bismark.net.co"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        )}

        {/* Formulario signup */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="signup-nombre" className="text-sm font-medium">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={signupData.nombre}
                  onChange={(e) => setSignupData({ ...signupData, nombre: e.target.value })}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="tu@bismark.net.co"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="pl-10 pr-10 h-11"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        )}

        {/* Toggle login/signup */}
        <p className="mt-6 text-sm text-center text-muted-foreground">
          {tab === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
            className="font-semibold text-primary hover:underline"
          >
            {tab === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>

      {/* Panel derecho — visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden items-center justify-center">
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white/5" />

        {/* Contenido central */}
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Gestión de Órdenes</h2>
          <p className="text-white/70 text-base max-w-xs mx-auto leading-relaxed">
            Control completo del flujo de pedidos, producción y despacho en un solo lugar.
          </p>

          {/* Tarjetas flotantes */}
          <div className="mt-10 space-y-3 max-w-xs mx-auto">
            {[
              { label: 'Órdenes activas', value: 'Seguimiento en tiempo real' },
              { label: 'Catálogos sincronizados', value: 'Conectado con Sapiens' },
              { label: 'Roles y permisos', value: 'Control por área' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl px-4 py-3 text-left">
                <div className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-white/60 text-xs">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
