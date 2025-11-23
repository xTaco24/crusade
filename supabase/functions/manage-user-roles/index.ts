import { createClient } from 'npm:@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  userId: string;
  roles: string[];
  action: 'set' | 'add' | 'remove';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar que el usuario actual es administrador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con service role para operaciones admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar token del usuario actual
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el usuario actual es administrador
    const currentUserRoles = [
      ...(user.app_metadata?.roles || []),
      ...(user.user_metadata?.roles || [])
    ]
    
    if (!currentUserRoles.includes('administrator')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Procesar la solicitud
    const { userId, roles, action }: RequestBody = await req.json()

    if (!userId || !roles || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, roles, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener usuario objetivo
    const { data: targetUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular nuevos roles
    let newRoles: string[] = []
    const currentRoles = targetUser.user.app_metadata?.roles || []

    switch (action) {
      case 'set':
        newRoles = roles
        break
      case 'add':
        newRoles = [...new Set([...currentRoles, ...roles])]
        break
      case 'remove':
        newRoles = currentRoles.filter((role: string) => !roles.includes(role))
        break
    }

    // Actualizar roles del usuario
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          ...targetUser.user.app_metadata,
          roles: newRoles
        }
      }
    )

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update user roles', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: updatedUser.user,
        roles: newRoles,
        message: `Roles updated successfully for ${targetUser.user.email}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in manage-user-roles function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})