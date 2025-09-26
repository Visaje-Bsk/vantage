import { useState, useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Edit,
  Save,
  X,
  Plus,
  Key,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { isValidUsername, isValidPassword, sanitizeUsername } from '@/lib/auth-utils';

interface EnrichedProfile {
  user_id: string;
  username: string | null;
  nombre: string | null;
  role: AppRole;
  created_at: string | null;
  last_sign_in_at: string | null;
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

export default function UserManagement() {
  const { profile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<EnrichedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ username: string; nombre: string; role: AppRole }>({ 
    username: '', 
    nombre: '', 
    role: 'comercial' 
  });
  
  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    nombre: '',
    password: '',
    role: 'comercial' as AppRole
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      // Get session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      // Call admin users function
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
        return;
      }

      setProfiles(data.data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Error al cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchProfiles();
    }
  }, [currentUserProfile]);

  const handleCreateUser = async () => {
    const username = sanitizeUsername(createForm.username);
    
    if (!isValidUsername(username)) {
      toast({
        title: "Error",
        description: "El username debe tener entre 3-32 caracteres y solo contener letras, números, puntos, guiones y guiones bajos",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPassword(createForm.password)) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!createForm.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          userData: {
            username,
            nombre: createForm.nombre.trim(),
            password: createForm.password,
            role: createForm.role
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el usuario",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuario creado",
        description: "El usuario se creó correctamente",
      });

      setShowCreateModal(false);
      setCreateForm({ username: '', nombre: '', password: '', role: 'comercial' });
      fetchProfiles();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Error al crear el usuario",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: EnrichedProfile) => {
    setEditingUser(user.user_id);
    setEditForm({
      username: user.username || '',
      nombre: user.nombre || '',
      role: user.role,
    });
  };

  const handleSaveUser = async (userId: string) => {
    const username = sanitizeUsername(editForm.username);
    
    if (editForm.username && !isValidUsername(username)) {
      toast({
        title: "Error",
        description: "El username debe tener entre 3-32 caracteres y solo contener letras, números, puntos, guiones y guiones bajos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'update',
          userId,
          userData: {
            username: username || undefined,
            nombre: editForm.nombre,
            role: editForm.role
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el usuario",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron correctamente",
      });

      setEditingUser(null);
      fetchProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: '', nombre: '', role: 'comercial' });
  };

  const handleChangePassword = async () => {
    if (!isValidPassword(passwordForm.password)) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'password',
          userId: passwordUserId,
          userData: {
            password: passwordForm.password
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo cambiar la contraseña",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "La contraseña se cambió correctamente",
      });

      setShowPasswordModal(false);
      setPasswordForm({ password: '', confirmPassword: '' });
      setPasswordUserId(null);
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Error al cambiar la contraseña",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'delete',
          userId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el usuario",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario se eliminó correctamente",
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: AppRole) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig || { label: role, color: 'bg-muted text-muted-foreground' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Gestión de Usuarios</span>
            </CardTitle>
            <CardDescription>
              {filteredProfiles.length} usuarios registrados
            </CardDescription>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa la información para crear un nuevo usuario
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="new-username"
                    autoComplete="off"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="usuario123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    name="new-fullname"
                    autoComplete="off"
                    value={createForm.nombre}
                    onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showCreatePassword ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select 
                    value={createForm.role} 
                    onValueChange={(value: AppRole) => setCreateForm({ ...createForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser}>
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredProfiles.map((user) => (
            <Card key={user.user_id} className="border">
              <CardContent className="pt-4">
                {editingUser === user.user_id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`username-${user.user_id}`}>Username</Label>
                        <Input
                          id={`username-${user.user_id}`}
                          name={`edit-username-${user.user_id}`}
                          autoComplete="off"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          placeholder="usuario123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`nombre-${user.user_id}`}>Nombre</Label>
                        <Input
                          id={`nombre-${user.user_id}`}
                          name={`edit-fullname-${user.user_id}`}
                          autoComplete="off"
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`role-${user.user_id}`}>Rol</Label>
                        <Select 
                          value={editForm.role} 
                          onValueChange={(value: AppRole) => setEditForm({ ...editForm, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={() => handleSaveUser(user.user_id)}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {user.nombre || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{user.username || 'sin-username'} • ID: {user.user_id.substring(0, 8)}...
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadge(user.role).color}>
                          {getRoleBadge(user.role).label}
                        </Badge>
                        {user.last_sign_in_at && (
                          <span className="text-xs text-muted-foreground">
                            Último acceso: {new Date(user.last_sign_in_at).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-muted-foreground">
                        {user.created_at ? 
                          new Date(user.created_at).toLocaleDateString('es-ES') : 
                          'Fecha no disponible'
                        }
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditUser(user)}
                        disabled={user.user_id === currentUserProfile?.user_id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setPasswordUserId(user.user_id);
                          setShowPasswordModal(true);
                        }}
                        disabled={user.user_id === currentUserProfile?.user_id}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={user.user_id === currentUserProfile?.user_id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario 
                              y todos sus datos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron usuarios con los criterios de búsqueda
          </div>
        )}
      </CardContent>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Introduce la nueva contraseña para el usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordModal(false);
              setPasswordForm({ password: '', confirmPassword: '' });
              setPasswordUserId(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}