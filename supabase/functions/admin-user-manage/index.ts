// Admin user management: create users + send password reset emails.
// Verifies caller is super_admin via JWT, then uses service role for privileged ops.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreatePayload {
  action: "create";
  email: string;
  password: string;
  full_name?: string;
  username?: string;
  department?: string;
  role: "super_admin" | "social_media" | "website" | "production";
  allowed_assets?: string[];
}
interface ResetPayload {
  action: "reset";
  email: string;
  redirect_to?: string;
}
type Payload = CreatePayload | ResetPayload;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    // Verify caller is a super_admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: userData.user.id, _role: "super_admin",
    });
    if (roleErr) return json({ error: roleErr.message }, 500);
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = (await req.json()) as Payload;

    if (body.action === "create") {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name ?? body.email,
          username: body.username ?? body.email.split("@")[0],
          role: body.role,
        },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "create_failed" }, 400);

      const uid = created.user.id;

      // Make sure role is exactly the requested one (handle_new_user trigger may have inserted default)
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("user_roles").insert({ user_id: uid, role: body.role });

      // Patch profile metadata
      await admin.from("profiles").update({
        full_name: body.full_name ?? null,
        username: body.username ?? null,
        department: body.department ?? null,
        allowed_assets: body.allowed_assets ?? [],
      }).eq("id", uid);

      return json({ ok: true, id: uid });
    }

    if (body.action === "reset") {
      const redirect = body.redirect_to ?? `${new URL(req.url).origin}/reset-password`;
      const { error: resetErr } = await admin.auth.resetPasswordForEmail(body.email, {
        redirectTo: redirect,
      });
      if (resetErr) return json({ error: resetErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e: any) {
    return json({ error: e?.message ?? "internal_error" }, 500);
  }
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
