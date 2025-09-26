import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Activity
} from 'lucide-react';

const capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
};

export default function Dashboard() {
  const { profile } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-destructive text-destructive-foreground',
      comercial: 'bg-primary text-primary-foreground',
      inventarios: 'bg-warning text-warning-foreground',
      produccion: 'bg-accent text-accent-foreground',
      logistica: 'bg-success text-success-foreground',
      facturacion: 'bg-muted text-muted-foreground',
      financiera: 'bg-secondary text-secondary-foreground',
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  // Mock data - replace with actual data from your API
  const dashboardStats = {
    ordenesActivas: 24,
    completadasHoy: 8,
    pendientes: 16,
    totalMes: 142,
    ventasMes: 145000,
    crecimiento: 12.5,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Panel de control - {capitalize(profile?.nombre || '')}
            <Badge className={`ml-2 ${getRoleBadgeColor(profile?.role || '')}`}>
              {capitalize(profile?.role || '')}
            </Badge>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Actualizado hace 5 min</span>
        </div>
      </div>

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
            <div className="text-2xl font-bold text-primary">{dashboardStats.ordenesActivas}</div>
            <p className="text-xs text-muted-foreground">+2 desde ayer</p>
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
            <div className="text-2xl font-bold text-success">{dashboardStats.completadasHoy}</div>
            <p className="text-xs text-muted-foreground">Meta: 10 diarias</p>
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
            <div className="text-2xl font-bold text-warning">{dashboardStats.pendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
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
            <div className="text-2xl font-bold text-accent">{dashboardStats.totalMes}</div>
            <p className="text-xs text-muted-foreground">Órdenes procesadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Ventas del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${dashboardStats.ventasMes.toLocaleString()}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-success mr-1" />
              <span className="text-success font-medium">+{dashboardStats.crecimiento}%</span>
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Resumen por Área
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comercial</span>
                <Badge variant="secondary">12 órdenes</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Producción</span>
                <Badge variant="secondary">8 en proceso</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Logística</span>
                <Badge variant="secondary">6 por enviar</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Facturación</span>
                <Badge variant="secondary">4 pendientes</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">Orden #ORD-2024-001 completada</p>
                <p className="text-xs text-muted-foreground">Cliente: Acme Corp - Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">Orden #ORD-2024-002 requiere revisión</p>
                <p className="text-xs text-muted-foreground">Área: Inventarios - Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nueva orden creada #ORD-2024-003</p>
                <p className="text-xs text-muted-foreground">Cliente: Tech Solutions - Hace 6 horas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}