import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create the user
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: "sunday@isunday.me",
    password: "Ronkus123@",
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  // Assign admin role
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({ user_id: user.user.id, role: "admin" });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, user_id: user.user.id }));
});
