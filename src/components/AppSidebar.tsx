import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart,
  Settings,
  Database,
  LayoutDashboard,
  LogOut,
  Clock,
  Box,
  Archive
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  roles: string[];
  badge?: string;
}

const capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
};

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/dashboard',
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Órdenes',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: '/ordenes',
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Historial',
    icon: <Archive className="w-5 h-5" />,
    href: '/ordenes/historial',
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Productos',
    icon: <Box className="w-5 h-5" />,
    href: '/productos',
    roles: ['admin', 'comercial', 'inventarios', 'produccion'],
  },
  {
    title: 'Catálogos',
    icon: <Database className="w-5 h-5" />,
    href: '/catalogos',
    roles: ['comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Administración',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin',
    roles: ['admin'],
  },
];

// Hook para fecha y hora
const useDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = () => {
    return dateTime.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota'
    });
  };

  const formatTime = () => {
    return dateTime.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  return { formatDate, formatTime };
};

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const { formatDate, formatTime } = useDateTime();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    signOut();
  };

  // Función para determinar si un link está activo
  const isLinkActive = (href: string) => {
    // Dashboard: activo en "/" o "/dashboard"
    if (href === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    // Para otros links, match exacto
    return currentPath === href;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userMenuItems = menuItems.filter(item =>
    item.roles.includes(profile?.role || '')
  );

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="bg-sidebar border-r shadow-lg"
    >
      {/* Header con branding mejorado */}
      <SidebarHeader className={`border-b border-sidebar-border/50 ${state === "collapsed" ? "p-3" : "p-6"}`}>
        <div className={`flex items-center ${state === "collapsed" ? "justify-center" : "space-x-3"}`}>
          <img src="/favicon.ico" alt="Vantage" className="h-10 w-auto rounded-lg" />
          {state === "collapsed" ? null : (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-sidebar-foreground">Vantage</h1>
              <p className="text-xs text-sidebar-foreground/60 font-medium">Órdenes de Pedido</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`${state === "collapsed" ? "px-3" : "px-4"} py-6`}>
        {/* Información del usuario mejorada */}
        {state === "collapsed" ? null : profile && (
          <div className="mb-6 p-4 bg-white/10 rounded-xl border border-white/10">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-white/20">
                <AvatarImage src="/placeholder-avatar.jpg" alt={profile.nombre} />
                <AvatarFallback className="bg-secondary text-white font-semibold">
                  {getUserInitials(profile.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {capitalize(profile.nombre)}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white border-0"
                  >
                    {capitalize(profile.role || '')}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3 text-white/60" />
                  <p className="text-xs text-white/60 truncate">
                    {formatTime()} • COL
                  </p>
                </div>
                <p className="text-xs text-white/50 mt-0.5 capitalize truncate">
                  {formatDate()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menú de navegación mejorado con tabs blancos */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-2">
              {userMenuItems.map((item) => {
                const isItemActive = isLinkActive(item.href);
                return (
                  <SidebarMenuItem key={item.title} className={state === "collapsed" ? "flex justify-center" : ""}>
                    <NavLink
                      to={item.href}
                      className={`${state === "collapsed" ? "flex items-center justify-center w-12 h-12 p-4" : "flex items-center justify-between px-3 py-2.5"} rounded-lg transition-all duration-200 ${
                        isItemActive
                          ? 'bg-[#0097a7] text-white font-semibold shadow-md'
                          : 'bg-white/90 text-gray-700 hover:bg-[#0097a7] hover:text-white hover:shadow-md'
                      }`}
                    >
                      {state === "collapsed" ? (
                        <div className="flex items-center justify-center w-full h-full text-current">
                          {item.icon}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="text-current">
                              {item.icon}
                            </div>
                            <span className="font-medium text-sm text-current">{item.title}</span>
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer mejorado */}
      <SidebarFooter className={`border-t border-sidebar-border/50 ${state === "collapsed" ? "p-3 flex flex-col items-center" : "p-4"} space-y-2`}>
        <SidebarTrigger className={`${state === "collapsed" ? "w-12 h-12 p-0" : "w-full h-10"} bg-white/90 text-gray-700 hover:bg-primary hover:text-white rounded-lg transition-all duration-200 shadow-sm flex items-center justify-center`} />
        <Button
          variant="ghost"
          onClick={() => setShowLogoutConfirm(true)}
          className={`${state === "collapsed" ? "w-12 h-12 p-0" : "w-full py-2.5 px-3 justify-start"} bg-white/90 text-gray-700 hover:bg-destructive hover:text-white rounded-lg transition-all duration-200 group shadow-sm flex items-center justify-center`}
        >
          <LogOut className={`${state === "collapsed" ? "w-5 h-5" : "w-4 h-4"} transition-colors duration-200 ${state === "collapsed" ? "" : "mr-3"}`} />
          {state === "collapsed" ? null : (
            <span className="font-medium text-sm">
              Cerrar Sesión
            </span>
          )}
        </Button>
      </SidebarFooter>

      {/* Modal de confirmación de logout */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}