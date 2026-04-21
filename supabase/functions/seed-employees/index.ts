// One-shot employee seeding from Office_ABN.xlsx data.
// SECURITY: Requires header `x-seed-key` matching SEED_KEY env var.
// After seeding completes, this function should be deleted.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-seed-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Dept = "website" | "social_media" | "production";
type AppRole = "super_admin" | Dept;

interface EmployeeRow {
  name: string;
  designation: string;
  dept: Dept;
  access: string; // raw "Access Permission" string
  email?: string;
}

// ───── Source data (from Office_ABN.xlsx) ─────
const ROWS: EmployeeRow[] = [
  // WEBSITE
  { name: "Uzair Ahmed Khan",   designation: "Senior Sub-Editor", dept: "website", access: "ABN Facebook" },
  { name: "Areeba Ahmed",       designation: "Shift Manager",     dept: "website", access: "Ausaf Facebook", email: "areebaahmedvirgo@gmail.com" },
  { name: "Muhammad Rafaqt",    designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },
  { name: "Rana Mehmood Ahmed", designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },
  { name: "Irfan Ullah",        designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },
  { name: "Abdul Khaliq",       designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },
  { name: "Arshad Khan",        designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },
  { name: "Saif Ullah",         designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },
  { name: "Yasir Nadeem",       designation: "Sub-Editor",        dept: "website", access: "ABN Facebook" },
  { name: "Rashid Nawaz",       designation: "Senior Sub-Editor", dept: "website", access: "ABN Facebook" },
  { name: "Irfan Siyal",        designation: "Sub-Editor",        dept: "website", access: "Ausaf Facebook" },

  // SOCIAL MEDIA
  { name: "Shanza Javed",       designation: "Shift Manager",            dept: "social_media", access: "Ausaf Facebook" },
  { name: "Pakeeza Gulfam",     designation: "Social Media Executive",   dept: "social_media", access: "ABN Facebook" },
  { name: "Ghelman Raza",       designation: "Social Media Executive",   dept: "social_media", access: "Ausaf Facebook" },
  { name: "Malaika Khaliq",     designation: "Social Media Executive",   dept: "social_media", access: "ABN Facebook" },
  { name: "Sheikh Shaheer",     designation: "Social Media Executive",   dept: "social_media", access: "ABN YouTube" },
  { name: "Taskeen Abbas",      designation: "Social Media Executive",   dept: "social_media", access: "Ausaf YouTube" },
  { name: "Misbah Ul Haq",      designation: "Shift Manager",            dept: "social_media", access: "ABN+ Ausaf", email: "akhunzada7245@gmail.com" },
  { name: "Muhammad Hasnain",   designation: "Social Media Executive",   dept: "social_media", access: "Ausaf Facebook" },
  { name: "Muhammad Awais",     designation: "Social Media Executive",   dept: "social_media", access: "ABN Facebook" },
  { name: "Danish Raza Baig",   designation: "Social Media Executive",   dept: "social_media", access: "ABN YouTube" },
  { name: "Mateen Akhtar",      designation: "Social Media Executive",   dept: "social_media", access: "Ausaf YouTube" },
  { name: "Arslan Sarwar",      designation: "Social Media Executive",   dept: "social_media", access: "ABN YouTube" },
  { name: "Yawar Ali",          designation: "Social Media Executive",   dept: "social_media", access: "Ausaf + ABN Facebook" },
  { name: "Shameer Ishfaq",     designation: "Social Media Executive",   dept: "social_media", access: "LIVE" },
  { name: "Zulqarnain Shafi",   designation: "Social Media Executive",   dept: "social_media", access: "ABN+ Ausaf (all)" },
  { name: "Touqeer Hussain",    designation: "Social Media Executive",   dept: "social_media", access: "Ausaf Facebook" },
  { name: "Bilal Nadeem",       designation: "Social Media Executive",   dept: "social_media", access: "ABN+ Ausaf (all)" },
  { name: "Sohail Manzoor",     designation: "Social Media Executive",   dept: "social_media", access: "Ausaf Life" },
  { name: "Sehrish Fatima",     designation: "Social Media Executive",   dept: "social_media", access: "Ausaf Life" },

  // DIGITAL PRODUCTION
  { name: "Asad Mehdi",         designation: "Head of Production",      dept: "production", access: "All Social Media Platforms" },
  { name: "Umar Farooq",        designation: "Content Writer",          dept: "production", access: "" },
  { name: "Asim Ahmed",         designation: "Shift Incharge",          dept: "production", access: "" },
  { name: "Waqas Ahmed",        designation: "NLE",                     dept: "production", access: "" },
  { name: "Moeed Raza",         designation: "NLE",                     dept: "production", access: "" },
  { name: "Wajid Ali",          designation: "NLE",                     dept: "production", access: "" },
  { name: "Zia ul Islam",       designation: "Shift Manager",           dept: "production", access: "" },
  { name: "Mateen Bukhari",     designation: "Social Media Executive",  dept: "production", access: "Ausaf Facebook + Insta" },
  { name: "Ehtisham Furqan",    designation: "Reporter",                dept: "production", access: "" },
  { name: "Marry Irfan",        designation: "Reporter",                dept: "production", access: "" },
  { name: "Arslan Zakir",       designation: "Social Media Executive",  dept: "production", access: "Ausaf Facebook + TikTok" },
  { name: "Malik Hamza",        designation: "Reporter",                dept: "production", access: "" },
  { name: "Touseeq Haider",     designation: "NLE",                     dept: "production", access: "" },
];

// ───── Asset universe ─────
// Base assets: each is created as a row in `assets` table.
const BASE_ASSETS = [
  { name: "ABN Facebook",   brand: "ABN",   platform: "facebook" },
  { name: "ABN YouTube",    brand: "ABN",   platform: "youtube" },
  { name: "Ausaf Facebook", brand: "Ausaf", platform: "facebook" },
  { name: "Ausaf YouTube",  brand: "Ausaf", platform: "youtube" },
  { name: "Ausaf Instagram",brand: "Ausaf", platform: "instagram" },
  { name: "Ausaf TikTok",   brand: "Ausaf", platform: "tiktok" },
  { name: "Ausaf Life",     brand: "Ausaf", platform: "facebook" },
  { name: "LIVE",           brand: "ABN",   platform: "live" },
];

// Map a raw "Access Permission" string → list of base asset names
function expandAccess(raw: string): string[] {
  const v = raw.trim().toLowerCase();
  if (!v || v === "na") return [];
  if (v === "abn facebook") return ["ABN Facebook"];
  if (v === "ausaf facebook") return ["Ausaf Facebook"];
  if (v === "abn youtube") return ["ABN YouTube"];
  if (v === "ausaf youtube") return ["Ausaf YouTube"];
  if (v === "ausaf life" || v === "ausaf life / ausaf") return ["Ausaf Life", "Ausaf Facebook"];
  if (v === "live") return ["LIVE"];
  if (v === "ausaf + abn facebook") return ["Ausaf Facebook", "ABN Facebook"];
  if (v === "ausaf facebook + insta" || v === "ausaf facebook, insta") return ["Ausaf Facebook", "Ausaf Instagram"];
  if (v === "ausaf facebook + tiktok" || v === "ausaf facebook, tiktok") return ["Ausaf Facebook", "Ausaf TikTok"];
  if (v === "abn+ ausaf") return ["ABN Facebook", "Ausaf Facebook"];
  if (v === "abn+ ausaf (all)") return ["ABN Facebook", "ABN YouTube", "Ausaf Facebook", "Ausaf YouTube"];
  if (v === "all social media platforms") return BASE_ASSETS.map((a) => a.name);
  return [];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

function emailFor(row: EmployeeRow): string {
  return row.email ?? `${slugify(row.name)}@abn.local`;
}

const TEMP_PASSWORD = "AbnTemp@2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const seedKey = req.headers.get("x-seed-key");
  const expected = Deno.env.get("SEED_KEY");
  if (!expected || seedKey !== expected) {
    return json({ error: "forbidden: missing or invalid x-seed-key" }, 403);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const log: any[] = [];

    // 1. Upsert assets
    for (const a of BASE_ASSETS) {
      const { data: existing } = await admin.from("assets").select("id").eq("name", a.name).maybeSingle();
      if (!existing) {
        const { error } = await admin.from("assets").insert({
          name: a.name, brand: a.brand, platform: a.platform, status: "active",
        });
        log.push({ asset: a.name, created: !error, error: error?.message });
      } else {
        log.push({ asset: a.name, created: false, existed: true });
      }
    }

    // 2. Upsert employees
    const results: any[] = [];
    for (const row of ROWS) {
      const email = emailFor(row);
      const username = slugify(row.name);
      const allowedAssets = expandAccess(row.access);

      // Check if user exists by listing — admin.listUsers is paginated, so we filter by email
      const { data: existingByEmail } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = existingByEmail.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      let uid: string;
      if (found) {
        uid = found.id;
        results.push({ name: row.name, email, action: "exists", uid });
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password: TEMP_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: row.name,
            username,
            role: row.dept,
          },
        });
        if (createErr || !created.user) {
          results.push({ name: row.name, email, action: "create_failed", error: createErr?.message });
          continue;
        }
        uid = created.user.id;
        results.push({ name: row.name, email, action: "created", uid });
      }

      // Force role + profile (handle_new_user trigger may have set defaults)
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("user_roles").insert({ user_id: uid, role: row.dept });

      await admin.from("profiles").update({
        full_name: row.name,
        username,
        department: row.designation,
        allowed_assets: allowedAssets,
        status: "active",
      }).eq("id", uid);
    }

    return json({
      ok: true,
      summary: {
        assets: log.length,
        employees_processed: results.length,
        created: results.filter((r) => r.action === "created").length,
        existed: results.filter((r) => r.action === "exists").length,
        failed: results.filter((r) => r.action === "create_failed").length,
      },
      temp_password: TEMP_PASSWORD,
      assets: log,
      employees: results,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal_error" }, 500);
  }
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
