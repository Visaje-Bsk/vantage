import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  BarChart3,
  Activity,
  RefreshCw,
  Send,
  Receipt,
  XCircle,
  Archive
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';

const capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Hace un momento';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  return format(date, 'dd MMM yyyy', { locale: es });
};

const getAccionLabel = (accionClave: string, faseNueva: string) => {
  const acciones: Record<string, string> = {
    'orden_creada': 'Orden creada',
    'fase_changed': `Movida a ${faseNueva}`,
    'estatus_changed': 'Estado actualizado',
    'orden_updated': 'Orden actualizada',
  };
  return acciones[accionClave] || accionClave;
};

export default function Dashboard() {
  const { profile } = useAuth();
  const {
    ordenesActivas,
    completadasHoy,
    pendientes,
    totalMes,
    ordenesPorFase,
    facturadas,
    enviadas,
    cerradas,
    anuladas,
    archivadas,
    actividadReciente,
    loading,
    error,
    refresh
  } = useDashboardStats();

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-destructive text-destructive-foreground',
      comercial: 'bg-primary text-primary-foreground',
      inventarios: 'bg-warning text-warning-foreground',
      produccion: 'bg-accent text-accent-foreground',
      logistica: 'bg-success text-success-foreground',
      facturacion: 'bg-muted text-muted-foreground',
      financiera: 'bg-secondary text-secondary-foreground',
      ingenieria: 'bg-blue-500 text-white',
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" description="Panel de Control" />
        <div className="p-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error al cargar el dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Panel de control - {capitalize(profile?.nombre || '')}
            <Badge className={`ml-2 ${getRoleBadgeColor(profile?.role || '')}`}>
              {capitalize(profile?.role || '')}
            </Badge>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="hidden md:flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                {loading ? 'Actualizando...' : 'Datos en tiempo real'}
              </span>
            </div>
          </>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Órdenes Activas
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">{ordenesActivas}</div>
                <p className="text-xs text-muted-foreground">Abiertas o enviadas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-r from-success/5 to-success/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completadas Hoy
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">{completadasHoy}</div>
                <p className="text-xs text-muted-foreground">Cerradas el día de hoy</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-r from-warning/5 to-warning/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
              <Clock className="w-4 h-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-warning">{pendientes}</div>
                <p className="text-xs text-muted-foreground">Borradores</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-r from-accent/5 to-accent/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Mes
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-accent">{totalMes}</div>
                <p className="text-xs text-muted-foreground">Órdenes este mes</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen por Estatus */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Resumen por Estatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <Send className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Enviadas</span>
                <span className="text-xl font-bold text-blue-500">{enviadas}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                <Receipt className="w-5 h-5 text-purple-500 mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Facturadas</span>
                <span className="text-xl font-bold text-purple-500">{facturadas}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-success/5 rounded-lg border border-success/20">
                <CheckCircle className="w-5 h-5 text-success mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Cerradas</span>
                <span className="text-xl font-bold text-success">{cerradas}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <XCircle className="w-5 h-5 text-destructive mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Anuladas</span>
                <span className="text-xl font-bold text-destructive">{anuladas}</span>
              </div>
              <Link to="/ordenes/historial" className="transition-transform hover:scale-105">
                <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg border border-muted hover:bg-muted/70 cursor-pointer">
                  <Archive className="w-5 h-5 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground mb-1">Archivadas</span>
                  <span className="text-xl font-bold text-foreground">{archivadas}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Ver historial →</span>
                </div>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen por Fase */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Resumen por Fase
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg">
                <span className="text-sm text-muted-foreground mb-1">Comercial</span>
                <span className="text-2xl font-bold text-primary">{ordenesPorFase.comercial}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-warning/5 rounded-lg">
                <span className="text-sm text-muted-foreground mb-1">Inventarios</span>
                <span className="text-2xl font-bold text-warning">{ordenesPorFase.inventarios}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-accent/5 rounded-lg">
                <span className="text-sm text-muted-foreground mb-1">Producción</span>
                <span className="text-2xl font-bold text-accent">{ordenesPorFase.produccion}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-success/5 rounded-lg">
                <span className="text-sm text-muted-foreground mb-1">Logística</span>
                <span className="text-2xl font-bold text-success">{ordenesPorFase.logistica}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-secondary/5 rounded-lg">
                <span className="text-sm text-muted-foreground mb-1">Facturación</span>
                <span className="text-2xl font-bold text-secondary">{ordenesPorFase.facturacion}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                <span className="text-sm text-muted-foreground mb-1">Financiera</span>
                <span className="text-2xl font-bold text-foreground">{ordenesPorFase.financiera}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : actividadReciente.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actividadReciente.slice(0, 5).map((actividad) => {
                const Icon = actividad.accion_clave === 'orden_creada' ? Package :
                           actividad.accion_clave === 'fase_changed' ? TrendingUp :
                           actividad.estatus_nuevo === 'cerrada' ? CheckCircle :
                           AlertCircle;

                const iconColor = actividad.estatus_nuevo === 'cerrada' ? 'text-success' :
                                actividad.accion_clave === 'orden_creada' ? 'text-primary' :
                                'text-warning';

                return (
                  <div key={actividad.id_historial} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Orden #{actividad.consecutivo_code || `OP-${actividad.id_orden_pedido}`}
                        {' - '}
                        {getAccionLabel(actividad.accion_clave, actividad.fase_nueva)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {actividad.nombre_cliente && `Cliente: ${actividad.nombre_cliente} - `}
                        {formatRelativeTime(actividad.timestamp_accion)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}