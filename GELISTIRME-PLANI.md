# YKS Ders Paneli - Geliştirme Planı

> **Hedef**: YKS'ye hazırlanan öğrenciler için abonelik tabanlı ders planlama ve takip uygulaması  
> **Teknoloji**: Next.js + Supabase + Vercel + Tailwind CSS

---

## 📋 Teknoloji Özeti

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| Frontend | Next.js 14 (App Router) | React tabanlı, SEO dostu |
| Styling | Tailwind CSS | Hızlı, tutarlı tasarım |
| Backend | Supabase | Auth, Database, Realtime, Storage |
| Hosting | Vercel | Next.js ile mükemmel uyum |
| Ödeme | iyzico / Paynkolay | Son aşamada entegre edilecek |

---

## 🗄️ Veritabanı Yapısı (Supabase)

### Kullanıcılar & Auth
- `profiles` — Supabase Auth ile senkron, ek bilgiler (ad, tema tercihi, abonelik durumu)
- Supabase Auth — email/şifre veya OAuth ile giriş

### Abonelik & Ödeme (Son Aşama)
- `subscriptions` — Kullanıcı abonelik durumu, başlangıç/bitiş tarihi
- `trial_uses` — Deneme süresi kötüye kullanımını önlemek için (telefon hash, IP vb.)

### İçerik Yapısı
- `programs` — Sınav türleri (TYT-AYT, LGS, DGS... — ileride eklenebilir)
- `subjects` — Dersler (Matematik, Türkçe, Tarih... — programa bağlı)
- `youtube_channels` — İzin verilen YouTube kanalları (admin tarafından eklenir)
- `youtube_videos` — Kanallardan çekilen/manuel eklenen video listesi (ders + konu ile eşleşir)

### Kullanıcı Verileri
- `resources` — Hazır kaynak listesi (APOTEMI, Orijinal, vb.) + kullanıcı ekledikleri
- `user_resources` — Kullanıcının kendi eklediği kaynaklar (isim serbest metin)
- `weekly_plans` — Haftalık plan ana kaydı (hangi hafta, hangi kullanıcı)
- `plan_tasks` — Günlük görevler (gün, ders, kaynak, soru sayısı, video/test/deneme tipi)
- `task_statuses` — Tamamlandı / Kısmen Tamamlandı / Tamamlanmadı
- `topic_completions` — Konu tamamlama işaretleri (kullanıcı + konu)

### İstatistik
- `daily_stats` — Günlük soru çözüm sayıları (istatistik grafikleri için)
- `weekly_stats` — Haftalık özet (performans takibi)

---

## 📱 Sayfa Yapısı

### Auth (Giriş Olmadan)
- `/login` — Giriş
- `/register` — Kayıt
- `/forgot-password` — Şifremi unuttum

### Ana Uygulama (Giriş Gerekli)
- `/` veya `/dashboard` — **Anasayfa / Haftalık Plan**
  - Haftanın günleri (Pazartesi–Pazar)
  - Her günde görevler listelenir
  - Göreve tıklayınca → **Popup**: Durum seç (Tamamlandı / Kısmen Tamamlandı / Tamamlanmadı)
  
- `/plan/add` veya `/gorev-ekle` — **Görev/Ödev Ekleme**
  - Tip seç: Video / Test / Deneme Sınavı
  - Gün seç
  - Ders seç
  - Kaynak seç (listeden veya "Kendi kaynağımı ekle")
  - Soru sayısı (test/deneme için)
  - Video linki veya video seçimi (video tipi için)

- `/istatistikler` — **İstatistik Paneli**
  - Haftalık soru çözüm grafiği
  - Derse göre konu tamamlama
  - Zaman içi ilerleme/düşüş grafikleri

- `/videolar` — **Video Dersler**
  - Dikkat dağıtıcısız, reklamsız arayüz
  - Sadece izin verilen kanalların videoları
  - Ders + konu filtreleme

- `/ayarlar` — **Ayarlar**
  - Kişisel bilgiler (ad, e-posta, telefon)
  - Tema (Açık / Koyu / Sistem)
  - Abonelik yönetimi (iptal, faturalar)

---

## 🔒 Deneme Süresi Koruması

7 gün ücretsiz deneme için kötüye kullanım önleme:

| Yöntem | Açıklama |
|--------|----------|
| **Telefon doğrulama** | Bir telefon numarası = bir deneme. En güçlü yöntem. |
| **Kredi kartı** | Denemeye başlarken kart bilgisi iste (ödeme alınmaz). Bir kart = bir deneme. |
| **E-posta doğrulama** | Geçici e-posta servislerini engelle (mailinator, tempmail vb.) |
| **Cihaz parmak izi** | Gelişmiş, karmaşık; başta gerekmez. |

**Öneri**: Telefon doğrulama veya deneme için kart bilgisi (ödeme alınmadan) — ikisinden biri yeterli.

---

## 📅 Geliştirme Aşamaları

### Faz 1: Temel Altyapı (Öncelik)
1. Next.js projesi oluştur
2. Supabase projesi kur
3. Auth (kayıt, giriş) entegrasyonu
4. Temel layout (sidebar, header)
5. Tema (açık/koyu) desteği

### Faz 2: Planlama Modülü ✅
1. Haftalık plan ekranı (anasayfa)
2. Görev ekleme sayfası (video/test/deneme)
3. Görev üzerine tıklayınca büyük popup (durum, not, silme)
4. Kaynak listesi (hazır + kendi ekle, tıklayınca açılan dropdown)
5. Geometri dersi eklendi
6. YKS 2026 sayacı haftalık planda

### Faz 3: İstatistikler ✅
1. Günlük/haftalık veri toplama
2. Grafik bileşenleri (Chart.js, Recharts veya Tremor)
3. Derse göre konu tamamlama görselleştirme

### Faz 4: Video Dersler ✅
1. YouTube kanal/video tabloları (youtube_channels, youtube_videos)
2. Video listeleme (ders + konu filtreleri)
3. Embed player (youtube-nocookie.com, odak modu arayüz)

### Faz 5: Ayarlar & Profil ✅
1. Profil düzenleme (Ad Soyad + Kaydet)
2. Alan seçimi (Eşit Ağırlık/Sayısal/Sözel/Dil/TYT) + Kaydet
3. Tema seçimi
4. Abonelik bilgisi alanı (Faz 6’da doldurulacak)

### Faz 6: Ödeme (Son Aşama)
1. iyzico veya Paynkolay entegrasyonu
2. Abonelik planları (aylık/yıllık)
3. Deneme süresi + koruma mantığı
4. İptal ve faturalama akışları

---

## 🎨 Tasarım Notları

- **Tailwind CSS** — utility-first, hızlı prototipleme
- **Masaüstü öncelik** — responsive ama önce 1024px+ ekranlar
- **Tema**: `prefers-color-scheme` ile sistem teması + manuel açık/koyu
- **Renk paleti**: Dikkat dağıtmayan, okumaya uygun tonlar

---

## 📊 Ölçeklenebilirlik

| Servis | Not |
|--------|-----|
| **İlk hedef** | ~100.000 kullanıcı — Vercel + Supabase Free/Pro yeterli |
| **İleride** | 2M+ için Pro planlar, connection pooling, read replicas |
| **YouTube API** | Kota limitleri var; video listesi cache'lenmeli |
| **CDN** | Vercel otomatik edge network kullanır |

---

## 🛠️ Öğrenme Kaynakları (Sıfırdan Başlayanlar İçin)

1. **Next.js**: [nextjs.org/learn](https://nextjs.org/learn) — Resmi interaktif ders
2. **Supabase**: [supabase.com/docs](https://supabase.com/docs) — Auth ve Database rehberleri
3. **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs) — Resmi dokümantasyon
4. **Vercel**: Projeyi GitHub'a bağlayıp otomatik deploy — [vercel.com/docs](https://vercel.com/docs)

---

## ✅ Sonraki Adım

**Faz 4: Video Dersler** — YouTube kanal listesi, video listeleme, embed player.
