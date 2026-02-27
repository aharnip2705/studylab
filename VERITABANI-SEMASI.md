# Veritabanı Şeması (Supabase/PostgreSQL)

Bu dosya Supabase Table Editor'da tabloları oluştururken referans alınacaktır.

---

## 1. profiles (Kullanıcı Profilleri)

Supabase Auth `auth.users` ile senkron. `auth.uid()` ile ilişkilendirilir.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK, FK → auth.users) | Auth user ID |
| full_name | text | Ad Soyad |
| email | text | E-posta |
| phone | text | Telefon (deneme koruması için) |
| theme | text | 'light' / 'dark' / 'system' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 2. programs (Sınav Programları)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| name | text | "TYT-AYT", "LGS", "DGS" |
| slug | text | "tyt-ayt", "lgs" |
| is_active | boolean | |
| created_at | timestamptz | |

---

## 3. subjects (Dersler)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| program_id | uuid (FK) | Hangi programa ait |
| name | text | "Matematik", "Türkçe", "Tarih" |
| slug | text | "matematik", "turkce" |
| sort_order | int | Sıralama |
| created_at | timestamptz | |

---

## 4. resources (Hazır Kaynak Listesi)

Admin tarafından eklenen popüler kaynaklar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| name | text | "APOTEMI", "Orijinal", "3-4-5" |
| program_id | uuid (FK, nullable) | Hangi program için (null = tümü) |
| created_at | timestamptz | |

---

## 5. user_resources (Kullanıcının Kendi Eklediği Kaynaklar)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| name | text | Kullanıcının yazdığı isim |
| created_at | timestamptz | |

---

## 6. youtube_channels (İzin Verilen YouTube Kanalları)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| channel_id | text | YouTube channel ID |
| channel_name | text | Kanal adı |
| subject_id | uuid (FK, nullable) | Hangi derse ait (null = genel) |
| is_active | boolean | |
| created_at | timestamptz | |

---

## 7. youtube_videos (Video Listesi)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| channel_id | text / channel FK | |
| video_id | text | YouTube video ID |
| title | text | Video başlığı |
| subject_id | uuid (FK) | Ders |
| topic | text | Konu (opsiyonel) |
| duration_seconds | int | Süre |
| published_at | timestamptz | |
| created_at | timestamptz | |

---

## 8. weekly_plans (Haftalık Plan Başlığı)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| program_id | uuid (FK) | |
| week_start_date | date | Haftanın başlangıç günü (Pazartesi) |
| created_at | timestamptz | |

**Unique**: (user_id, week_start_date)

---

## 9. plan_tasks (Günlük Görevler)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| weekly_plan_id | uuid (FK) | |
| task_date | date | Hangi gün |
| day_of_week | int | 1=Pzt, 7=Paz |
| subject_id | uuid (FK) | Ders |
| task_type | text | 'video' / 'test' / 'deneme' |
| resource_id | uuid (FK, nullable) | Hazır listeden |
| user_resource_id | uuid (FK, nullable) | Kullanıcı eklediği |
| question_count | int | Soru sayısı (test/deneme için) |
| video_id | uuid (FK, nullable) | Video tipinde |
| youtube_video_id | text | Direkt YouTube ID (alternatif) |
| status | text | 'tamamlanmadi' / 'kismen_tamamlandi' / 'tamamlandi' |
| notes | text | Opsiyonel not |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 10. topic_completions (Konu Tamamlama)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| subject_id | uuid (FK) | |
| topic_name | text | Konu adı |
| completed_at | timestamptz | |
| created_at | timestamptz | |

---

## 11. daily_stats (Günlük İstatistik - İleride)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| stat_date | date | |
| questions_solved | int | |
| topics_completed | int | |
| created_at | timestamptz | |

**Unique**: (user_id, stat_date)

---

## 12. subscriptions (Abonelik - Son Aşama)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| status | text | 'trial' / 'active' / 'cancelled' / 'expired' |
| plan | text | 'monthly' / 'yearly' |
| started_at | timestamptz | |
| expires_at | timestamptz | |
| cancelled_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 13. trial_uses (Deneme Kullanımı - Kötüye Kullanım Önleme)

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid (PK) | |
| phone_hash | text | Telefon numarasının hash'i (aynı numara tekrar deneme alamaz) |
| ip_hash | text | IP hash (opsiyonel ek koruma) |
| used_at | timestamptz | |

---

## Row Level Security (RLS)

Tüm tablolarda:
- `profiles`: Kullanıcı sadece kendi satırını görebilir/güncelleyebilir
- `plan_tasks`, `weekly_plans`, `user_resources`: Sadece ilgili user_id'ye ait veriler
- `subscriptions`: Sadece kendi abonelik bilgisi
- `resources`, `subjects`, `programs`, `youtube_channels`, `youtube_videos`: Herkes okuyabilir (SELECT), yazma admin için

---

## İlk Veri (Seed)

- **programs**: TYT-AYT
- **subjects**: Matematik, Türkçe, Tarih, Coğrafya, Fizik, Kimya, Biyoloji, Edebiyat, Felsefe, Din Kültürü...
- **resources**: APOTEMI, Orijinal, 3-4-5, Palme, Karekök, Aydın Yayınları, vb.
