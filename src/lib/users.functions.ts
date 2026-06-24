import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPetugas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: roleRows, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "petugas");
    if (rolesErr) throw new Error(rolesErr.message);
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, nama, email, no_hp, nik, created_at")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    return (profiles ?? []).sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );
  });

export const createPetugas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      password: string;
      nama: string;
      no_hp?: string;
      nik?: string;
    }) => {
      if (!input.email || !input.password || !input.nama) {
        throw new Error("Email, password, dan nama wajib diisi");
      }
      if (input.password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          nama: data.nama,
          no_hp: data.no_hp ?? null,
          nik: data.nik ?? null,
        },
      });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Gagal membuat user");
    }

    const userId = created.user.id;

    // Trigger handle_new_user assigns 'warga' by default — upgrade to petugas.
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "warga");

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "petugas" });
    if (roleErr) throw new Error(roleErr.message);

    return { id: userId };
  });

export const deletePetugas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input.userId) throw new Error("userId wajib");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePetugas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      email?: string;
      password?: string;
      nama?: string;
      no_hp?: string;
      nik?: string;
    }) => {
      if (!input.userId) {
        throw new Error("User ID wajib diisi");
      }
      if (input.password && input.password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = data.password;

    const userMetadata: any = {};
    if (data.nama) userMetadata.nama = data.nama;
    if (data.no_hp !== undefined) userMetadata.no_hp = data.no_hp;
    if (data.nik !== undefined) userMetadata.nik = data.nik;

    if (Object.keys(userMetadata).length > 0) {
      updateData.user_metadata = userMetadata;
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
      data.userId,
      updateData
    );
    if (authErr) throw new Error(authErr.message);

    const profileUpdate: any = {};
    if (data.nama) profileUpdate.nama = data.nama;
    if (data.email) profileUpdate.email = data.email;
    if (data.no_hp !== undefined) profileUpdate.no_hp = data.no_hp;
    if (data.nik !== undefined) profileUpdate.nik = data.nik;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", data.userId);
      if (profileErr) throw new Error(profileErr.message);
    }

    return { ok: true };
  });
