# YKS Ders Paneli

YKS'ye hazırlanan öğrenciler için abonelik tabanlı ders planlama ve takip uygulaması.

## Teknoloji

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend & DB**: Supabase
- **Hosting**: Vercel

## Kurulum

### 1. Node.js Kurulumu

[Node.js](https://nodejs.org/) (v18+) kurulu olmalı. Kurulumdan sonra terminalde kontrol edin:

```bash
node -v
npm -v
```

### 2. Bağımlılıkları Yükle

```bash
cd YKS-Panel
npm install
```

### 3. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) hesabı açın
2. Yeni proje oluşturun
3. **Settings → API** bölümünden şunları kopyalayın:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Ortam Değişkenleri

Proje kökünde `.env.local` dosyası oluşturun (`.env.local.example` dosyasını kopyalayın):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Supabase Veritabanı Kurulumu

Supabase Dashboard → **SQL Editor** → New Query. Aşağıdaki migration dosyalarını sırayla çalıştırın:
1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_plans.sql`

### 6. Auth Ayarları (Supabase)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (geliştirme için)
- **Redirect URLs**: `http://localhost:3000/auth/callback` ekleyin

**E-posta onayı**: **Authentication → Providers → Email** → "Confirm email"
- **Geliştirme (SMTP yok)**: **Kapatın** → E-posta gönderilmez, rate limit olmaz, hesap otomatik aktif
- **Canlı ortam**: **Açın** + Custom SMTP kurun → Kayıt sonrası e-posta gönderilir

### 6b. E-posta Gönderimi (Kayıt / Şifremi Unuttum)

Varsayılan Supabase e-postası **saatte 2–3 mail** ile sınırlıdır ve sadece Proje Ekibi adreslerine gider. Gerçek kullanıcılara mail göndermek için:

1. Supabase Dashboard → **Project Settings → Authentication → SMTP**
2. **Custom SMTP** seçin
3. Resend, SendGrid, Brevo, AWS SES vb. servisten SMTP bilgilerini girin:
   - Host (örn: `smtp.resend.com`)
   - Port (örn: 465)
   - User / Password (API key)
   - Sender e-posta (örn: `noreply@yourdomain.com`)

SMTP kurulduktan sonra kayıt ve şifremi unuttum mailleri buradan gönderilir.

### 7. Uygulamayı Çalıştır

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Faz 1 Tamamlandı ✅

- [x] Next.js projesi
- [x] Supabase Auth (giriş, kayıt, şifremi unuttum)
- [x] Login / Register / Forgot Password sayfaları
- [x] Dashboard layout (sidebar, header)
- [x] Tema desteği (açık / koyu / sistem)
- [x] Profil tablosu ve otomatik oluşturma

## Faz 2 Tamamlandı ✅

- [x] Haftalık plan ekranı (7 günlük grid)
- [x] Görev ekleme formu (video / test / deneme)
- [x] Görev durumu popup'ı (Tamamlandı / Kısmen / Tamamlanmadı)
- [x] Kaynak listesi (hazır + kendi ekle)

## Faz 3 Tamamlandı ✅

- [x] İstatistik paneli (günlük soru çözümü, derse göre dağılım)
- [x] Bar grafik (günlük)
- [x] Pasta grafik (ders bazlı)

## Sonraki Adımlar (Faz 4)

- Video dersler

## Dokümanlar

- `GELISTIRME-PLANI.md` — Genel geliştirme planı
- `VERITABANI-SEMASI.md` — Veritabanı tablo yapısı
