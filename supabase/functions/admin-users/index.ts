import { createClient } from 'npm:@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface UserManagementRequest {
  action: 'list' | 'update_roles';
  userId?: string;
  roles?: string[];
}

Deno.serve(async (req) => {
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar variables de entorno críticas
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ 
          error: 'Configuración del servidor incompleta',
          details: 'Variables de entorno faltantes'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar autorización
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó token de autorización' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token || token.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Token de autorización inválido o malformado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con privilegios de servicio
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el usuario actual es administrador
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error al verificar usuario:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Token inválido o expirado',
          details: userError?.message || 'No se pudo verificar el usuario'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar roles de administrador
    const currentUserRoles = [
      ...(user.app_metadata?.roles || []),
      ...(user.user_metadata?.roles || [])
    ]
    
    if (!currentUserRoles.includes('administrator')) {
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes - Se requiere rol de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Procesar solicitud según el método
    if (req.method === 'GET') {
      // Listar todos los usuarios
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error('Error al listar usuarios:', listError)
        return new Response(
          JSON.stringify({ 
            error: 'Error al obtener lista de usuarios', 
            details: listError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          users: users.users || [],
          count: users.users?.length || 0,
          message: `Se encontraron ${users.users?.length || 0} usuarios`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Actualizar roles de usuario
      const { action, userId, roles }: UserManagementRequest = await req.json()

      if (action === 'update_roles' && userId && roles) {
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            app_metadata: { roles }
          }
        )

        if (updateError) {
          return new Response(
            JSON.stringify({ 
              error: 'Error al actualizar roles', 
              details: updateError.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: updatedUser.user,
            message: 'Roles actualizados exitosamente'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método o acción no soportada' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en función admin-users:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})