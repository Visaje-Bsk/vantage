import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Permission {
  perm_code: string;
  category: string;
  description: string;
  created_at: string;
}

export interface RolePermission {
  role: string;
  perm_code: string;
  allowed: boolean;
  updated_at: string;
}

export interface PermissionMatrix {
  permissions: Permission[];
  rolePermissions: RolePermission[];
}

// Hook to check if current user has a specific permission
export function usePermission(permCode: string): boolean {
  const { profile } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    const checkPermission = async () => {
      try {
        // Admin has all permissions
        if (profile.role === 'admin') {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // Use the RPC function to check permission
        const { data, error } = await supabase.rpc('has_permission', {
          perm_code: permCode
        });

        if (error) {
          console.error('Error checking permission:', error);
          setHasPermission(false);
        } else {
          setHasPermission(data || false);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permCode, profile]);

  return hasPermission;
}

// Hook to fetch all permissions and role permissions (admin only)
export function usePermissionMatrix() {
  const [data, setData] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: response, error: functionError } = await supabase.functions.invoke('admin-permissions', {
        method: 'GET'
      });

      if (functionError) {
        throw functionError;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      setData({
        permissions: response.permissions || [],
        rolePermissions: response.rolePermissions || []
      });
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const updatePermissions = async (updates: RolePermission[]) => {
    try {
      const { data: response, error: functionError } = await supabase.functions.invoke('admin-permissions', {
        method: 'PUT',
        body: { updates }
      });

      if (functionError) {
        throw functionError;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data after successful update
      await fetchPermissions();
      
      return { success: true, message: response.message };
    } catch (err) {
      console.error('Error updating permissions:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchPermissions,
    updatePermissions
  };
}