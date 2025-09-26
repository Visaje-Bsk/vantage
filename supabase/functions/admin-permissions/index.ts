import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PermissionData {
  perm_code: string;
  category: string;
  description: string;
}

interface RolePermissionData {
  role: string;
  perm_code: string;
  allowed: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user's JWT token
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: 'No authorization token provided' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authToken);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin role required.' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === 'GET') {
      console.log('Fetching permissions and role permissions...');
      
      // Get all permissions
      const { data: permissions, error: permError } = await supabaseAdmin
        .from('permission')
        .select('*')
        .order('category', { ascending: true })
        .order('perm_code', { ascending: true });

      if (permError) {
        console.error('Error fetching permissions:', permError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch permissions' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get all role permissions
      const { data: rolePermissions, error: rolePermError } = await supabaseAdmin
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true });

      if (rolePermError) {
        console.error('Error fetching role permissions:', rolePermError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch role permissions' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetched ${permissions.length} permissions and ${rolePermissions.length} role permissions`);

      return new Response(
        JSON.stringify({ 
          permissions,
          rolePermissions 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      const body = await req.json();
      const { updates }: { updates: RolePermissionData[] } = body;

      if (!updates || !Array.isArray(updates)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body. Expected updates array.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing ${updates.length} permission updates...`);

      // Get current role permissions for audit trail
      const { data: currentPermissions } = await supabaseAdmin
        .from('role_permissions')
        .select('*');

      const currentPermMap = new Map(
        currentPermissions?.map(p => [`${p.role}:${p.perm_code}`, p.allowed]) || []
      );

      // Prepare audit events
      const auditEvents = updates.map(update => ({
        actor: user.id,
        role: update.role,
        perm_code: update.perm_code,
        allowed_before: currentPermMap.get(`${update.role}:${update.perm_code}`) || false,
        allowed_after: update.allowed
      }));

      // Start transaction-like operations
      try {
        // Upsert role permissions
        const { error: upsertError } = await supabaseAdmin
          .from('role_permissions')
          .upsert(
            updates.map(update => ({
              role: update.role,
              perm_code: update.perm_code,
              allowed: update.allowed,
              updated_at: new Date().toISOString()
            })),
            { onConflict: 'role,perm_code' }
          );

        if (upsertError) {
          console.error('Error upserting role permissions:', upsertError);
          return new Response(
            JSON.stringify({ error: 'Failed to update permissions' }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Insert audit events
        const { error: auditError } = await supabaseAdmin
          .from('rbac_event')
          .insert(auditEvents);

        if (auditError) {
          console.error('Error inserting audit events:', auditError);
          // Don't fail the request for audit errors, just log them
        }

        console.log(`Successfully updated ${updates.length} permissions`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Updated ${updates.length} permissions successfully` 
          }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Transaction error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to process permission updates' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});