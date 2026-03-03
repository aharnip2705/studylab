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
export type ProgramExamType = "YKS" | "LGS" | "KPSS";

/** KPSS ders bazlı konu listesi (Genel Yetenek + Genel Kültür) */
export const KPSS_TOPICS: Record<string, string[]> = {
  "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Sözcük Türleri", "Sözcük Yapısı", "Fiilimsi", "Cümle Türleri", "Anlatım Bozukluğu", "Ses Bilgisi", "Yazım Kuralları"],
  "Matematik": ["Temel Kavramlar", "Sayılar", "Bölünebilme", "OBEB-OKEK", "Rasyonel Sayılar", "Üslü-Köklü Sayılar", "Mutlak Değer", "Oran-Orantı", "Denklemler", "Fonksiyonlar", "Olasılık", "Geometri"],
  "Atatürk İlkeleri ve İnkılap Tarihi": ["19. Yüzyılda Osmanlı", "Türk İnkılabı", "Atatürk İlkeleri", "Türkiye Cumhuriyeti Tarihi"],
  "Anayasa": ["Temel Kavramlar", "Devlet", "Hukuk", "Türk Anayasa Hukuku", "Yasama", "Yürütme", "Yargı", "Temel Haklar"],
  "Vatandaşlık": ["Vatandaşlık", "Demokrasi", "İnsan Hakları", "Toplumsal Kurumlar"],
  "Tarih": ["İlk ve Orta Çağ", "Türk-İslam Tarihi", "Osmanlı Tarihi", "20. Yüzyıl"],
  "Coğrafya": ["Fiziki Coğrafya", "Beşeri Coğrafya", "Türkiye Coğrafyası", "Ekonomik Coğrafya"],
  "Eğitim Bilimleri": ["Gelişim Psikolojisi", "Öğrenme Psikolojisi", "Rehberlik", "Program Geliştirme", "Öğretim Yöntemleri"],
};

/** LGS ders bazlı konu listesi */
export const LGS_TOPICS: Record<string, string[]> = {
  "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Sözcük Türleri", "Fiilimsi", "Cümle Türleri", "Yazım Kuralları"],
  "Matematik": ["Sayılar", "Cebir", "Geometri", "Veri", "Olasılık"],
  "Fen Bilimleri": ["Hücre", "Canlılar", "Kuvvet", "Enerji", "Madde", "Elektrik"],
  "T.C. İnkılap Tarihi ve Atatürkçülük": ["Bir Kahraman Doğuyor", "Milli Uyanış", "Ya İstiklal Ya Ölüm", "Çağdaş Türkiye Yolunda Adımlar"],
  "Din Kültürü ve Ahlak Bilgisi": ["İnanç", "İbadet", "Hz. Muhammed", "Vahy ve Akıl"],
  "İngilizce": ["Friendship", "Teen Life", "In The Kitchen", "On The Phone", "The Internet"],
};

export function getTopicsByExam(examType: ExamType): Record<string, string[]> {
  return examType === "tyt" ? TYT_TOPICS : AYT_TOPICS;
}

/** Sınav tipine göre konu seti döndürür */
export function getTopicsByProgram(programExamType: ProgramExamType): Record<string, string[]> {
  if (programExamType === "KPSS") return KPSS_TOPICS;
  if (programExamType === "LGS") return LGS_TOPICS;
  return TYT_TOPICS; // YKS için TYT varsayılan
}

/** YKS için TYT/AYT ayrımı, diğerleri için tek set */
export function getExamSections(programExamType: ProgramExamType): { id: string; label: string }[] {
  if (programExamType === "YKS") return [{ id: "tyt", label: "TYT" }, { id: "ayt", label: "AYT" }];
  if (programExamType === "KPSS") return [{ id: "kpss", label: "KPSS" }];
  if (programExamType === "LGS") return [{ id: "lgs", label: "LGS" }];
  return [{ id: "tyt", label: "TYT" }];
}
