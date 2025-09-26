import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, Save, RotateCcw, Shield, Users, Database, FileText, Download } from 'lucide-react';
import { usePermissionMatrix, RolePermission } from '@/hooks/usePermissions';
import { AppRole } from '@/contexts/AuthContext';

const ROLES: AppRole[] = ['admin', 'comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  comercial: 'Comercial',
  inventarios: 'Inventarios',
  produccion: 'Producción',
  logistica: 'Logística',
  facturacion: 'Facturación',
  financiera: 'Financiera',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ordenes: <Shield className="w-4 h-4" />,
  detalles: <FileText className="w-4 h-4" />,
  catalogos: <Database className="w-4 h-4" />,
  usuarios: <Users className="w-4 h-4" />,
  reportes: <Download className="w-4 h-4" />
};

export default function PermissionMatrix() {
  const { data, loading, error, updatePermissions } = usePermissionMatrix();
  const [searchTerm, setSearchTerm] = useState('');
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    if (!data?.permissions) return {};
    
    return data.permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, typeof data.permissions>);
  }, [data?.permissions]);

  // Create permission map for quick lookup
  const permissionMap = useMemo(() => {
    if (!data?.rolePermissions) return new Map();
    
    return new Map(
      data.rolePermissions.map(rp => [`${rp.role}:${rp.perm_code}`, rp.allowed])
    );
  }, [data?.rolePermissions]);

  // Filter permissions based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return permissionsByCategory;
    
    const filtered: Record<string, typeof data.permissions> = {};
    
    Object.entries(permissionsByCategory).forEach(([category, permissions]) => {
      const matchingPermissions = permissions.filter(
        perm => 
          perm.perm_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingPermissions.length > 0) {
        filtered[category] = matchingPermissions;
      }
    });
    
    return filtered;
  }, [permissionsByCategory, searchTerm]);

  const getPermissionValue = (role: AppRole, permCode: string): boolean => {
    const key = `${role}:${permCode}`;
    if (changes.has(key)) {
      return changes.get(key)!;
    }
    return permissionMap.get(key) || false;
  };

  const togglePermission = (role: AppRole, permCode: string) => {
    const key = `${role}:${permCode}`;
    const currentValue = getPermissionValue(role, permCode);
    const originalValue = permissionMap.get(key) || false;
    const newValue = !currentValue;
    
    const newChanges = new Map(changes);
    
    if (newValue === originalValue) {
      // If new value matches original, remove from changes
      newChanges.delete(key);
    } else {
      // Otherwise, track the change
      newChanges.set(key, newValue);
    }
    
    setChanges(newChanges);
  };

  const toggleAllForRole = (role: AppRole, enabled: boolean) => {
    const newChanges = new Map(changes);
    
    Object.values(filteredCategories).flat().forEach(permission => {
      const key = `${role}:${permission.perm_code}`;
      const originalValue = permissionMap.get(key) || false;
      
      if (enabled === originalValue) {
        newChanges.delete(key);
      } else {
        newChanges.set(key, enabled);
      }
    });
    
    setChanges(newChanges);
  };

  const toggleAllForPermission = (permCode: string, enabled: boolean) => {
    const newChanges = new Map(changes);
    
    ROLES.forEach(role => {
      if (role === 'admin') return; // Skip admin as they have all permissions
      
      const key = `${role}:${permCode}`;
      const originalValue = permissionMap.get(key) || false;
      
      if (enabled === originalValue) {
        newChanges.delete(key);
      } else {
        newChanges.set(key, enabled);
      }
    });
    
    setChanges(newChanges);
  };

  const resetChanges = () => {
    setChanges(new Map());
  };

  const saveChanges = async () => {
    if (changes.size === 0) {
      toast.info('No hay cambios para guardar');
      return;
    }

    setSaving(true);
    try {
      const updates: RolePermission[] = Array.from(changes.entries()).map(([key, allowed]) => {
        const [role, permCode] = key.split(':');
        return {
          role,
          perm_code: permCode,
          allowed,
          updated_at: new Date().toISOString()
        };
      });

      const result = await updatePermissions(updates);
      toast.success(result.message || 'Permisos actualizados correctamente');
      setChanges(new Map());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar los permisos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = changes.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles & Permisos</h2>
          <p className="text-muted-foreground">
            Gestiona los permisos del sistema por rol
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={resetChanges}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Descartar
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Changes indicator */}
      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{changes.size}</Badge>
                <span className="text-sm">cambios pendientes</span>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={resetChanges}>
                  Descartar
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={saving}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Matrix */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium min-w-[200px]">Permiso</th>
                  {ROLES.map(role => (
                    <th key={role} className="text-center p-4 font-medium min-w-[120px]">
                      <div className="space-y-2">
                        <div>{ROLE_LABELS[role]}</div>
                        {role !== 'admin' && (
                          <div className="flex justify-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleAllForRole(role, true)}
                            >
                              Todo
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleAllForRole(role, false)}
                            >
                              Nada
                            </Button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredCategories).map(([category, permissions], categoryIndex) => (
                  <React.Fragment key={category}>
                    {categoryIndex > 0 && (
                      <tr>
                        <td colSpan={ROLES.length + 1} className="p-0">
                          <Separator />
                        </td>
                      </tr>
                    )}
                    <tr className="bg-muted/25">
                      <td colSpan={ROLES.length + 1} className="p-4">
                        <div className="flex items-center space-x-2">
                          {CATEGORY_ICONS[category]}
                          <span className="font-medium capitalize">{category}</span>
                        </div>
                      </td>
                    </tr>
                    {permissions.map(permission => (
                      <tr key={permission.perm_code} className="border-b border-border/50 hover:bg-muted/25">
                        <td className="p-4">
                          <div>
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {permission.perm_code}
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                            <div className="flex items-center space-x-1 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleAllForPermission(permission.perm_code, true)}
                              >
                                Activar todo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleAllForPermission(permission.perm_code, false)}
                              >
                                Desactivar todo
                              </Button>
                            </div>
                          </div>
                        </td>
                        {ROLES.map(role => (
                          <td key={`${role}-${permission.perm_code}`} className="p-4 text-center">
                            {role === 'admin' ? (
                              <Badge variant="secondary" className="text-xs">
                                Siempre
                              </Badge>
                            ) : (
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={getPermissionValue(role, permission.perm_code)}
                                  onCheckedChange={() => togglePermission(role, permission.perm_code)}
                                  className="data-[state=checked]:bg-primary"
                                />
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
