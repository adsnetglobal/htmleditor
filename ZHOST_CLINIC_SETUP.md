# Zhost Klinik - CMS, SEO, dan Security Setup

Dokumen ini melengkapi implementasi transformasi website menjadi platform klinik kecantikan profesional.

## 1) Legal Asset Policy

- Semua aset visual baru pada implementasi ini menggunakan file SVG lokal di folder `assets/brand/`.
- Tidak ada penyalinan langsung aset proprietary milik pihak ketiga.
- Jika ingin mengganti foto/ikon final produksi, gunakan hanya aset:
  - milik internal Zhost Klinik, atau
  - berlisensi komersial yang valid.

## 2) Headless CMS (Contentful) Integration

Frontend mengambil data dari `assets/js/cms-client.js` dengan fallback ke `assets/data/fallback-content.js`.

Konfigurasi CMS ada di:

- `assets/js/cms-config.js`

Isi value berikut sebelum production:

- `spaceId`
- `environment`
- `accessToken` (Content Delivery API)

### Content Type yang dibutuhkan

1. `services`
   - `name` (Short text)
   - `slug` (Short text)
   - `category` (Short text)
   - `price` (Short text)
   - `summary` (Long text)
   - `heroImage` (Media)
   - `detailImage` (Media)
   - `benefits` (Array of text)
   - `process` (Array of text)
   - `seoTitle` (Short text)
   - `seoDescription` (Short text)

2. `articles`
   - `title`
   - `slug`
   - `excerpt`
   - `coverImage`
   - `publishedAt` (Date)
   - `author`
   - `category`
   - `content` (Array of text / rich text)
   - `seoTitle`
   - `seoDescription`

3. `testimonials`, `gallery`, `promos` (opsional lanjutan sesuai UI homepage)

### Slug SEO-friendly

Slug dinormalisasi di frontend lewat `slugifySeo()`:

- huruf kecil
- spasi menjadi `-`
- karakter non-alphanumeric dihapus

Rekomendasi validasi field di Contentful:

- Regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

## 3) Appointment & Newsletter Backend (Google Apps Script)

Action baru di `appscript.js`:

- `book_appointment`
- `subscribe_newsletter`
- `confirm_newsletter`
- `get_clinic_content`

Sheet yang otomatis dibuat jika belum ada:

- `Appointment_Requests`
- `Newsletter_Subscribers`
- `Clinic_Content`

Newsletter sudah memakai **double opt-in** via token konfirmasi email.

## 4) SEO Teknis

Generate otomatis:

```bash
npm run generate:seo
```

Output:

- `robots.txt`
- `sitemap.xml`

Semua halaman utama telah disiapkan dengan:

- meta title (maks 60 karakter)
- meta description (maks 160 karakter)
- OpenGraph + Twitter Card
- schema.org (`MedicalClinic`, `Article`, `BreadcrumbList`)

## 5) Google Search Console & Bing Webmaster

Setelah deploy domain final:

1. Buka Google Search Console
2. Add Property (Domain atau URL Prefix)
3. Verifikasi DNS TXT
4. Submit sitemap: `https://<domain>/sitemap.xml`
5. Ulangi langkah serupa di Bing Webmaster Tools

## 6) Security Baseline

Sudah diterapkan:

- HTTPS + HSTS (`_headers`)
- CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- Worker rate-limiting (global + sensitive actions)
- Input sanitization pada appointment/newsletter

Variabel environment worker yang direkomendasikan:

- `APP_GAS_URL`
- `ALLOWED_ORIGINS`
- `API_RPM_SOFT_LIMIT`
- `SENSITIVE_API_RPM_LIMIT`
- `METRICS_TOKEN`
- `MOOTA_GAS_URL` / `MOOTA_TOKEN` (jika webhook aktif)
