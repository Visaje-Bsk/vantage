import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminRequest {
  action: 'create' | 'update' | 'delete' | 'list' | 'password';
  userId?: string;
  userData?: {
    username?: string;
    nombre?: string;
    role?: string;
    password?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client for user validation (we'll attach the Bearer token per request)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set the session for the regular client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    // Use admin client for DB reads/writes to bypass RLS, since we've already validated admin via token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, userData }: AdminRequest = await req.json();

    console.log(`Admin action: ${action}`, { userId, userData });

    switch (action) {
      case 'list': {
        // Get profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch profiles' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get auth users for last_sign_in_at
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
          console.error('Error fetching auth users:', authError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch auth users' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Merge data
        const enrichedProfiles = profiles?.map(profile => {
          const authUser = authUsers.users.find(u => u.id === profile.user_id);
          return {
            ...profile,
            last_sign_in_at: authUser?.last_sign_in_at || null
          };
        }) || [];

        return new Response(
          JSON.stringify({ data: enrichedProfiles }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!userData?.username || !userData?.password) {
          return new Response(
            JSON.stringify({ error: 'Username and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const email = `${userData.username.toLowerCase()}@bismark.net.co`;

        // Check if username already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .eq('username', userData.username.toLowerCase())
          .single();

        if (existingProfile) {
          return new Response(
            JSON.stringify({ error: 'Username already exists' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create user in auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            username: userData.username.toLowerCase(),
            nombre: userData.nombre || ''
          }
        });

        if (createError) {
          console.error('Error creating user:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Ensure profile exists and update with username and role (upsert in case row hasn't been created yet)
        const { data: upsertedProfile, error: upsertError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: newUser.user.id,
            username: userData.username.toLowerCase(),
            nombre: userData.nombre || '',
            role: userData.role || 'comercial'
          }, { onConflict: 'user_id' })
          .select('*')
          .single();

        if (upsertError) {
          console.error('Error upserting profile:', upsertError);
          // Cleanup: delete the auth user if profile update fails
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: 'Failed to create user profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Profile created/updated:', upsertedProfile);
        return new Response(
          JSON.stringify({ data: { success: true, user_id: newUser.user.id, profile: upsertedProfile } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData: any = {};
        let needsAuthUpdate = false;
        let newEmail = '';

        if (userData?.nombre !== undefined) updateData.nombre = userData.nombre;
        if (userData?.role !== undefined) updateData.role = userData.role;

        if (userData?.username !== undefined) {
          const newUsername = userData.username.toLowerCase();

          // Check if new username already exists (excluding current user)
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .eq('username', newUsername)
            .neq('user_id', userId)
            .single();

          if (existingProfile) {
            return new Response(
              JSON.stringify({ error: 'Username already exists' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          updateData.username = newUsername;
          newEmail = `${newUsername}@bismark.net.co`;
          needsAuthUpdate = true;
        }

        // Use upsert to guarantee the profile row is created/updated
        const upsertPayload = { user_id: userId, ...updateData };
        console.log('Upserting profile with payload:', upsertPayload);
        const { data: updatedProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert(upsertPayload, { onConflict: 'user_id' })
          .select('*')
          .single();

        if (profileError) {
          console.error('Error updating profile:', profileError);
          return new Response(
            JSON.stringify({ error: 'Failed to update profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Updated profile row:', updatedProfile);

        // Update auth user if username changed
        if (needsAuthUpdate) {
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: newEmail,
            user_metadata: {
            username: userData?.username?.toLowerCase() || '',
            nombre: userData?.nombre || ''
            }
          });

          if (authUpdateError) {
            console.error('Error updating auth user:', authUpdateError);
            return new Response(
              JSON.stringify({ error: 'Failed to update user email' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        return new Response(
          JSON.stringify({ data: { success: true } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'password': {
        if (!userId || !userData?.password) {
          return new Response(
            JSON.stringify({ error: 'User ID and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userData.password
        });

        if (passwordError) {
          console.error('Error updating password:', passwordError);
          return new Response(
            JSON.stringify({ error: 'Failed to update password' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: { success: true } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete user (cascade will handle profile)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to delete user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: { success: true } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});