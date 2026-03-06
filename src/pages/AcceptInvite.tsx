import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenHash = params.get('access_token');
    const type = params.get('type');

    if (tokenHash && type === 'invite') {
      // Verificar el token de invitación con verifyOtp
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' }).then(({ error }) => {
        if (error) {
          toast({ title: "Enlace inválido", description: "El enlace de invitación expiró o ya fue usado.", variant: "destructive" });
        } else {
          setSessionReady(true);
        }
      });
      return;
    }

    // Fallback: si Supabase ya estableció sesión automáticamente (flujo email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) setSessionReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Actualizar contraseña
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      // Actualizar nombre y rol en profiles
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const assignedRole = user.user_metadata?.role || 'comercial';
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ nombre: nombre.trim(), role: assignedRole })
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      }

      toast({ title: "Cuenta activada", description: "Bienvenido a Vantage" });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo activar la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando enlace de invitación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="flex flex-col justify-center w-full max-w-md px-10 py-12 bg-background">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Activa tu cuenta</h1>
          <p className="text-sm text-muted-foreground">Completa tu perfil para comenzar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nombre"
                type="text"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                required
                minLength={8}
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

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
            {loading ? 'Activando cuenta...' : 'Activar cuenta'}
          </Button>
        </form>
      </div>

      {/* Panel derecho */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden items-center justify-center">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Bienvenido al equipo</h2>
          <p className="text-white/70 text-base max-w-xs mx-auto leading-relaxed">
            Configura tu cuenta para comenzar a gestionar órdenes de pedido.
          </p>
        </div>
      </div>
    </div>
  );
}
