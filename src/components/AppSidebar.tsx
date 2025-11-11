import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart,
  Package,
  Truck,
  FileText,
  DollarSign,
  Settings,
  Plus,
  Database,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Box
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  roles: string[];
  badge?: string;
  subItems?: MenuItem[];
}

const capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
};

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    href: '/dashboard',
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Órdenes',
    icon: <ShoppingCart className="w-4 h-4" />,
    roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
    subItems: [
      {
        title: 'Todas las Órdenes',
        icon: <ShoppingCart className="w-4 h-4" />,
        href: '/ordenes',
        roles: ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
      },
      {
        title: 'Inventarios',
        icon: <Package className="w-4 h-4" />,
        href: '/ordenes?filter=inventarios',
        roles: ['admin', 'inventarios'],
      },
      {
        title: 'Producción',
        icon: <FileText className="w-4 h-4" />,
        href: '/ordenes?filter=produccion',
        roles: ['admin', 'produccion'],
      },
      {
        title: 'Logística',
        icon: <Truck className="w-4 h-4" />,
        href: '/ordenes?filter=logistica',
        roles: ['admin', 'logistica'],
      },
      {
        title: 'Facturación',
        icon: <FileText className="w-4 h-4" />,
        href: '/ordenes?filter=facturacion',
        roles: ['admin', 'facturacion'],
      },
      {
        title: 'Financiera',
        icon: <DollarSign className="w-4 h-4" />,
        href: '/ordenes?filter=financiera',
        roles: ['admin', 'financiera'],
      },
    ],
  },
  {
    title: 'Productos',
    icon: <Box className="w-4 h-4" />,
    href: '/productos',
    roles: ['admin', 'comercial', 'inventarios', 'produccion'],
  },
  {
    title: 'Catálogos',
    icon: <Database className="w-4 h-4" />,
    href: '/catalogos',
    roles: ['comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
  },
  {
    title: 'Administración',
    icon: <Settings className="w-4 h-4" />,
    href: '/admin',
    badge: 'Solo Admin',
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
  const [openGroups, setOpenGroups] = useState<string[]>(['Órdenes']);
  const { formatDate, formatTime } = useDateTime();

  const currentPath = location.pathname;

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      comercial: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      inventarios: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      produccion: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      logistica: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      facturacion: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      financiera: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
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

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (item: MenuItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => subItem.href && isActive(subItem.href));
    }
    return false;
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="bg-sidebar border-r shadow-lg"
    >
      {/* Header con branding mejorado */}
      <SidebarHeader className="border-b border-sidebar-border/50 p-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          {state === "collapsed" ? null : (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-sidebar-foreground">Bismark</h1>
              <p className="text-xs text-sidebar-foreground/60 font-medium">Órdenes de Pedido</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
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
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className="w-full justify-between rounded-lg transition-all duration-200 px-3 py-2.5 bg-white/90 text-gray-700 hover:bg-[#0097a7] hover:text-white hover:shadow-md"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-700">
                              {item.icon}
                            </div>
                            {state === "collapsed" ? null : (
                              <span className="font-medium text-sm text-current">{item.title}</span>
                            )}
                          </div>
                          {state === "collapsed" ? null : (
                            <div className={`transition-transform duration-200 text-current ${openGroups.includes(item.title) ? 'rotate-0' : '-rotate-90'}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {state === "collapsed" ? null : (
                        <CollapsibleContent className="mt-2">
                          <SidebarMenuSub className="ml-4 pl-3 space-y-1.5 border-l-2 border-white/20">
                            {item.subItems
                              .filter(subItem => subItem.roles.includes(profile?.role || ''))
                              .map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={subItem.href || '#'}
                                      className={({ isActive }) =>
                                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                          isActive
                                            ? 'bg-white text-primary font-semibold shadow-md border-l-4 border-secondary'
                                            : 'bg-white/80 text-gray-600 hover:bg-[#0097a7] hover:text-white hover:shadow-md'
                                        }`
                                      }
                                    >
                                      <div className="text-current">
                                        {subItem.icon}
                                      </div>
                                      <span className="text-sm text-current">{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href || '#'}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-white text-white font-semibold shadow-md border-l-4 border-secondary'
                              : 'bg-white/90 text-gray-700 hover:bg-[#0097a7] hover:text-white hover:shadow-md'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-current">
                            {item.icon}
                          </div>
                          {state === "collapsed" ? null : (
                            <span className="font-medium text-sm text-current">{item.title}</span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer mejorado */}
      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start bg-white/90 text-gray-700 hover:bg-destructive hover:text-white rounded-lg transition-all duration-200 group shadow-sm px-3 py-2.5"
        >
          <LogOut className="w-4 h-4 mr-3 transition-colors duration-200" />
          {state === "collapsed" ? null : (
            <span className="font-medium text-sm">
              Cerrar Sesión
            </span>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}