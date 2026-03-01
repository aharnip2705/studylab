/** TYT ve AYT ders bazlı konu listesi (kısaltılmış müfredat) */
export const TYT_TOPICS: Record<string, string[]> = {
  "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Sözcük Türleri", "Sözcük Yapısı", "Fiilimsi", "Cümle Türleri", "Anlatım Bozukluğu", "Ses Bilgisi", "Yazım Kuralları"],
  "Matematik": ["Temel Kavramlar", "Sayı Basamakları", "Bölünebilme", "OBEB-OKEK", "Rasyonel Sayılar", "Üslü Sayılar", "Köklü Sayılar", "Mutlak Değer", "Çarpanlara Ayırma", "Oran-Orantı", "Denklemler", "Fonksiyonlar", "Polinomlar", "İkinci Derece Denklem", "Geometri Temelleri"],
  "Fizik": ["Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket", "Kuvvet", "İş ve Enerji", "Isı ve Sıcaklık", "Elektrostatik", "Elektrik Akımı"],
  "Kimya": ["Kimya Bilimi", "Atom ve Periyodik Tablo", "Kimyasal Türler", "Kimyasal Tepkimeler", "Mol", "Sulu Çözeltiler"],
  "Biyoloji": ["Canlıların Ortak Özellikleri", "Hücre", "Canlıların Sınıflandırılması", "Ekoloji"],
  "Tarih": ["Tarih Bilimi", "İlk ve Orta Çağ", "Türk-İslam Tarihi", "Osmanlı Devleti"],
  "Coğrafya": ["Doğa ve İnsan", "Yer Şekilleri", "İklim", "Nüfus", "Göç", "Türkiye Fiziki Coğrafyası"],
  "Felsefe": ["Felsefe Giriş", "Bilgi Felsefesi", "Bilim Felsefesi", "Varlık Felsefesi"],
  "Din Kültürü": ["İnanç", "İbadet", "Hz. Muhammed", "Vahy ve Akıl"],
};

export const AYT_TOPICS: Record<string, string[]> = {
  "Matematik": ["Trigonometri", "Fonksiyonlar", "Logaritma", "Diziler", "Limit", "Türev", "İntegral", "Analitik Geometri", "Çember", "Katı Cisimler"],
  "Fizik": ["Elektrik ve Manyetizma", "Dalga Mekaniği", "Optik", "Modern Fizik", "Atom Fiziği"],
  "Kimya": ["Organik Kimya", "Enerji", "Kimyasal Tepkimelerde Hız", "Kimyasal Denge", "Çözünürlük"],
  "Biyoloji": ["Hücre Bölünmesi", "Kalıtım", "Ekosistem", "Canlılarda Davranış"],
  "Edebiyat": ["Şiir", "Öykü", "Roman", "Tiyatro", "Sözlü Anlatım", "Divan Edebiyatı", "Halk Edebiyatı"],
  "Tarih": ["20. Yüzyıl Başları", "Kurtuluş Savaşı", "Atatürk İlkeleri", "Türkiye Cumhuriyeti Tarihi"],
  "Coğrafya": ["Doğal Sistemler", "Beşeri Sistemler", "Küresel Ortam", "Çevre ve Toplum"],
  "Felsefe": ["Felsefe Tarihi", "Mantık", "Psikoloji", "Sosyoloji"],
};

export type ExamType = "tyt" | "ayt";

export function getTopicsByExam(examType: ExamType): Record<string, string[]> {
  return examType === "tyt" ? TYT_TOPICS : AYT_TOPICS;
}
