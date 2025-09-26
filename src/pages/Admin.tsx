import { useState, useEffect } from 'react';
import { AppRole, useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import CatalogManagement from '@/components/admin/CatalogManagement';
import PermissionMatrix from '@/components/admin/PermissionMatrix';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  nombre: string | null;
  role: AppRole;
  created_at: string | null;
}

const roles: Array<{ value: AppRole; label: string; color: string }> = [
  { value: 'admin', label: 'Administrador', color: 'bg-destructive text-destructive-foreground' },
  { value: 'comercial', label: 'Comercial', color: 'bg-primary text-primary-foreground' },
  { value: 'inventarios', label: 'Inventarios', color: 'bg-warning text-warning-foreground' },
  { value: 'produccion', label: 'Producción', color: 'bg-accent text-accent-foreground' },
  { value: 'logistica', label: 'Logística', color: 'bg-success text-success-foreground' },
  { value: 'facturacion', label: 'Facturación', color: 'bg-secondary text-secondary-foreground' },
  { value: 'financiera', label: 'Financiera', color: 'bg-muted text-muted-foreground' },
];

export default function Admin() {
  const { profile: currentUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', role: '' as AppRole });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("No se pudieron cargar los usuarios");
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchProfiles();
    }
  }, [currentUserProfile]);

  const handleEditUser = (user: Profile) => {
    setEditingUser(user.user_id);
    setEditForm({
      nombre: user.nombre || '',
      role: user.role,
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: editForm.nombre,
          role: editForm.role,
        })
        .eq('user_id', userId);

      if (error) {
        toast.error("No se pudo actualizar el usuario");
        return;
      }

      toast.success("Los cambios se guardaron correctamente");
      setEditingUser(null);
      fetchProfiles();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("Ocurrió un error al guardar los cambios");
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ nombre: '', role: 'comercial' });
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: AppRole) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig || { label: role, color: 'bg-muted text-muted-foreground' };
  };

  if (currentUserProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            <CardDescription>
              Solo los administradores pueden acceder a esta sección
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestión de usuarios y configuración del sistema</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Módulos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant={activeTab === 'usuarios' ? 'secondary' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('usuarios')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Usuarios
                </Button>
                <Button 
                  variant={activeTab === 'catalogos' ? 'secondary' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('catalogos')}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Catálogos
                </Button>
                <Button 
                  variant={activeTab === 'configuracion' ? 'secondary' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('configuracion')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'usuarios' && <UserManagement />}
            {activeTab === 'catalogos' && <CatalogManagement />}
            {activeTab === 'configuracion' && (
              <div>
                <PermissionMatrix />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}