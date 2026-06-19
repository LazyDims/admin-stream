# Plan: Konversi SQL Migrations ke Prisma Schema + PostgreSQL

## Overview

Konversi 2 SQL migration file Supabase menjadi:
1. **`schema.prisma`** — Prisma schema dengan semua models
2. **`prisma/migrations/[timestamp]_init/migration.sql`** — Auto-generated Prisma migration
3. **`supabase/migrations/RLS_and_functions.sql`** — RLS policies, PL/pgSQL functions, triggers
4. **`prisma/seed.ts`** — Seed script untuk data jenis_surat

---

## Phase 1: Create Prisma Schema (`schema.prisma`)

### Enums
- `AppRole` (warga, petugas, admin)
- `StatusPengajuan` (menunggu_verifikasi, diproses, disetujui, ditolak, selesai)

### Models

#### 1. **Profile**
```
- id (String, @id, UUID)
- nama (String)
- nik (String, optional)
- alamat (String, optional)
- no_hp (String, optional)
- email (String, optional)
- created_at (DateTime, @default(now()))
- updated_at (DateTime, @updatedAt)
- relationships: userRoles, pengajuanSurat, auditLogs
```

#### 2. **UserRole**
```
- id (String, @id, UUID)
- user_id (String, UUID, FK to User)
- role (AppRole enum)
- created_at (DateTime, @default(now()))
- @@unique([userId, role])
- relationships: user
```

#### 3. **JenisSurat**
```
- id (String, @id, UUID)
- kode (String, @unique)
- nama (String)
- deskripsi (String, optional)
- persyaratan (Json, @default("[]"))
- aktif (Boolean, @default(true))
- created_at (DateTime, @default(now()))
- updated_at (DateTime, @updatedAt)
- relationships: pengajuanSurat
```

#### 4. **PengajuanSurat**
```
- id (String, @id, UUID)
- nomor (String, @unique)
- user_id (String, UUID, FK to User)
- jenis_surat_id (String, UUID, FK to JenisSurat)
- keperluan (String)
- data_tambahan (Json, @default("{}"))
- status (StatusPengajuan, @default(menunggu_verifikasi))
- catatan_petugas (String, optional)
- petugas_id (String, optional, UUID, FK to User)
- file_pdf_url (String, optional)
- hash_sha256 (String, optional)
- qr_token (String, optional, @unique)
- created_at (DateTime, @default(now()))
- updated_at (DateTime, @updatedAt)
- completed_at (DateTime, optional)
- relationships: user, jenisSurat, petugas, dokumenPersyaratan
```

#### 5. **DokumenPersyaratan**
```
- id (String, @id, UUID)
- pengajuan_id (String, UUID, FK to PengajuanSurat, @onDelete(Cascade))
- nama (String)
- file_url (String)
- created_at (DateTime, @default(now()))
- relationships: pengajuan
```

#### 6. **AuditLog**
```
- id (String, @id, UUID)
- user_id (String, optional, UUID, FK to User, @onDelete(SetNull))
- action (String)
- entity (String, optional)
- entity_id (String, optional, UUID)
- metadata (Json, @default("{}"))
- created_at (DateTime, @default(now()))
- relationships: user
```

### Special Notes
- **user field**: Referensi ke `auth.users` dari Supabase Auth (tidak di-define di Prisma, hanya FK di DB)
- **Timestamps**: Gunakan Prisma `@updatedAt` + SQL trigger untuk full compatibility
- **RLS Policies**: Dihandle di Phase 3 (SQL migration terpisah)
- **Functions**: `has_role()`, `set_updated_at()`, `handle_new_user()` — SQL migration terpisah

---

## Phase 2: Generate Prisma Migration

**Command:**
```bash
prisma migrate dev --name init
```

**Output:**
- File: `prisma/migrations/[timestamp]_init/migration.sql`
- Berisi: CREATE TABLE, CREATE TYPE (enums), indexes, constraints, foreign keys
- Prisma otomatis generate dari schema.prisma

---

## Phase 3: Create SQL Migration untuk RLS & Functions

**File:** `supabase/migrations/RLS_and_functions.sql`

### Contents

1. **Revoke Permissions** (dari migration #2)
   - REVOKE EXECUTE pada functions dari PUBLIC, anon
   - GRANT EXECUTE pada has_role() ke authenticated

2. **RLS Policies** (dari migration #1)
   - `profiles`: SELECT (own), UPDATE (own), INSERT (own)
   - `user_roles`: SELECT (own)
   - `jenis_surat`: SELECT public, ALL (admin only)
   - `pengajuan_surat`: SELECT (own/petugas/admin), INSERT (warga only), UPDATE (petugas/admin), SELECT public (via qr_token)
   - `dokumen_persyaratan`: SELECT (via pengajuan), INSERT (own pengajuan)
   - `audit_logs`: SELECT (admin only), INSERT (own user)

3. **PL/pgSQL Functions** (dari migration #1)
   - `has_role(user_id, role)` — Check if user has role
   - `set_updated_at()` — Trigger function untuk update `updated_at`
   - `handle_new_user()` — Auto-create profile & role on signup

4. **Triggers**
   - `profiles_updated` — Before UPDATE, call set_updated_at()
   - `jenis_surat_updated` — Before UPDATE, call set_updated_at()
   - `pengajuan_updated` — Before UPDATE, call set_updated_at()
   - `on_auth_user_created` — After INSERT on auth.users, call handle_new_user()

5. **Grants**
   - Sesuaikan dengan migration #2 (authenticated, service_role permissions)

---

## Phase 4: Create Prisma Seed Script

**File:** `prisma/seed.ts`

### Contents

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing jenis_surat (optional)
  await prisma.jenisSurat.deleteMany();

  // Seed 4 jenis_surat
  const jenisSuratData = [
    {
      kode: 'SKD',
      nama: 'Surat Keterangan Domisili',
      deskripsi: 'Surat yang menyatakan tempat tinggal warga di wilayah kecamatan.',
      persyaratan: ['Scan KTP', 'Scan Kartu Keluarga', 'Surat Pengantar RT/RW'],
    },
    {
      kode: 'SKU',
      nama: 'Surat Keterangan Usaha',
      deskripsi: 'Surat keterangan kepemilikan usaha untuk keperluan administrasi.',
      persyaratan: ['Scan KTP', 'Foto Tempat Usaha', 'Surat Pengantar RT/RW'],
    },
    {
      kode: 'SPNG',
      nama: 'Surat Pengantar',
      deskripsi: 'Surat pengantar umum dari kecamatan.',
      persyaratan: ['Scan KTP', 'Scan Kartu Keluarga'],
    },
    {
      kode: 'SKTM',
      nama: 'Surat Keterangan Tidak Mampu',
      deskripsi: 'Surat keterangan untuk warga kurang mampu (bantuan/pendidikan).',
      persyaratan: [
        'Scan KTP',
        'Scan Kartu Keluarga',
        'Surat Pengantar RT/RW',
        'Slip Penghasilan (jika ada)',
      ],
    },
  ];

  for (const data of jenisSuratData) {
    await prisma.jenisSurat.create({
      data: {
        ...data,
        persyaratan: data.persyaratan, // Prisma handles JSON serialization
      },
    });
  }

  console.log('✅ Seeded 4 jenis_surat');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Usage
```bash
# Add to package.json:
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}

# Run seed:
prisma db seed
```

---

## Execution Order

1. ✅ **Create `schema.prisma`** — Define semua models
2. ✅ **Run `prisma migrate dev --name init`** — Generate migration dari schema
3. ✅ **Create `supabase/migrations/RLS_and_functions.sql`** — Add RLS, functions, triggers
4. ✅ **Run SQL migration** — Via Supabase CLI atau direct SQL execute
5. ✅ **Create `prisma/seed.ts`** — Seed script
6. ✅ **Run `prisma db seed`** — Populate jenis_surat

---

## Verification Checklist

- [ ] `schema.prisma` valid (no syntax errors)
- [ ] `prisma generate` berhasil → PrismaClient generated
- [ ] `prisma migrate dev --name init` berhasil → migration file created
- [ ] RLS SQL migration berjalan tanpa error
- [ ] `prisma db seed` berhasil → 4 jenis_surat inserted
- [ ] Check di Supabase console:
  - [ ] Tables ada: profiles, user_roles, jenis_surat, pengajuan_surat, dokumen_persyaratan, audit_logs
  - [ ] ENUMs ada: app_role, status_pengajuan
  - [ ] RLS enabled on tables
  - [ ] Data: 4 rows di jenis_surat
- [ ] Test RLS policies (sign in as different roles, verify data access)

---

## Notes

- **Auth Users**: Tabel `auth.users` dari Supabase Auth, bukan di-manage Prisma
- **UUID Generation**: Prisma `@default(cuid())` atau `@default(uuid())` — gunakan `uuid()` untuk match Supabase `gen_random_uuid()`
- **JSONB**: Prisma `Json` type auto-handles JSONB serialization
- **Triggers untuk `updated_at`**: SQL trigger dihandle via `set_updated_at()` function; Prisma `@updatedAt` is redundant but compatible
- **RLS tidak di Prisma**: Prisma belum support RLS definition, jadi must stay di SQL migration

---

## Relevant Files to Create

```
schema.prisma
prisma/migrations/[timestamp]_init/migration.sql (auto-generated)
supabase/migrations/RLS_and_functions.sql
prisma/seed.ts
```

## Relevant Files to Update

```
package.json (add prisma seed config)
```
