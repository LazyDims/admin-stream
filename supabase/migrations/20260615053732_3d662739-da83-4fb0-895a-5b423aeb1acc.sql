
-- Enums
CREATE TYPE public.app_role AS ENUM ('warga','petugas','admin');
CREATE TYPE public.status_pengajuan AS ENUM ('menunggu_verifikasi','diproses','disetujui','ditolak','selesai');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nik TEXT,
  alamat TEXT,
  no_hp TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profil sendiri dibaca" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profil sendiri diubah" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Insert profil sendiri" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lihat role sendiri" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, nik, alamat, no_hp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'nik',
    NEW.raw_user_meta_data->>'alamat',
    NEW.raw_user_meta_data->>'no_hp'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'warga');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Jenis surat
CREATE TABLE public.jenis_surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  persyaratan JSONB NOT NULL DEFAULT '[]'::jsonb,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jenis_surat TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.jenis_surat TO authenticated;
GRANT ALL ON public.jenis_surat TO service_role;
ALTER TABLE public.jenis_surat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jenis surat publik" ON public.jenis_surat FOR SELECT USING (true);
CREATE POLICY "Admin kelola jenis surat" ON public.jenis_surat FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER jenis_surat_updated BEFORE UPDATE ON public.jenis_surat
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pengajuan surat
CREATE TABLE public.pengajuan_surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis_surat_id UUID NOT NULL REFERENCES public.jenis_surat(id),
  keperluan TEXT NOT NULL,
  data_tambahan JSONB DEFAULT '{}'::jsonb,
  status public.status_pengajuan NOT NULL DEFAULT 'menunggu_verifikasi',
  catatan_petugas TEXT,
  petugas_id UUID REFERENCES auth.users(id),
  file_pdf_url TEXT,
  hash_sha256 TEXT,
  qr_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pengajuan_surat TO authenticated;
GRANT SELECT ON public.pengajuan_surat TO anon;
GRANT ALL ON public.pengajuan_surat TO service_role;
ALTER TABLE public.pengajuan_surat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Warga lihat pengajuan sendiri" ON public.pengajuan_surat FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'petugas') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Warga buat pengajuan" ON public.pengajuan_surat FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Petugas/admin ubah pengajuan" ON public.pengajuan_surat FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'petugas') OR public.has_role(auth.uid(),'admin'));
-- Public can read minimal fields for verification (via qr_token lookup) - allow anon SELECT, frontend selects needed columns only
CREATE POLICY "Verifikasi publik via token" ON public.pengajuan_surat FOR SELECT TO anon USING (qr_token IS NOT NULL);
CREATE TRIGGER pengajuan_updated BEFORE UPDATE ON public.pengajuan_surat
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Dokumen persyaratan
CREATE TABLE public.dokumen_persyaratan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID NOT NULL REFERENCES public.pengajuan_surat(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dokumen_persyaratan TO authenticated;
GRANT ALL ON public.dokumen_persyaratan TO service_role;
ALTER TABLE public.dokumen_persyaratan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dokumen by pengajuan" ON public.dokumen_persyaratan FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.pengajuan_surat p WHERE p.id=pengajuan_id
    AND (p.user_id=auth.uid() OR public.has_role(auth.uid(),'petugas') OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Insert dokumen pemilik" ON public.dokumen_persyaratan FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.pengajuan_surat p WHERE p.id=pengajuan_id AND p.user_id=auth.uid()));

-- Audit log
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin lihat audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Insert audit oleh user sendiri" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Seed jenis surat
INSERT INTO public.jenis_surat (kode, nama, deskripsi, persyaratan) VALUES
('SKD','Surat Keterangan Domisili','Surat yang menyatakan tempat tinggal warga di wilayah kecamatan.',
 '["Scan KTP","Scan Kartu Keluarga","Surat Pengantar RT/RW"]'::jsonb),
('SKU','Surat Keterangan Usaha','Surat keterangan kepemilikan usaha untuk keperluan administrasi.',
 '["Scan KTP","Foto Tempat Usaha","Surat Pengantar RT/RW"]'::jsonb),
('SPNG','Surat Pengantar','Surat pengantar umum dari kecamatan.',
 '["Scan KTP","Scan Kartu Keluarga"]'::jsonb),
('SKTM','Surat Keterangan Tidak Mampu','Surat keterangan untuk warga kurang mampu (bantuan/pendidikan).',
 '["Scan KTP","Scan Kartu Keluarga","Surat Pengantar RT/RW","Slip Penghasilan (jika ada)"]'::jsonb);
