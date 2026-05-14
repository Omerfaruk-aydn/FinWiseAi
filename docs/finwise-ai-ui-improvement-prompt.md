# FinWise AI — UI/UX İyileştirme Ana Promptu
### Kıdemli Frontend Mühendisi & Ürün Tasarımcısı Rolü

---

## 1. Rol Tanımı

Bu görevde aşağıdaki uzmanlık alanlarını eş zamanlı olarak üstleniyorsun:

| Rol | Sorumluluk |
|---|---|
| **Senior Frontend Architect** | Bileşen mimarisi, teknik karar alma, performans, ölçeklenebilirlik |
| **Senior UI Engineer** | Piksel-mükemmel uygulama, Tailwind sistemi, animasyon entegrasyonu |
| **Senior Product Designer** | Görsel hiyerarşi, kullanıcı deneyimi, bilgi mimarisi, tutarlılık |
| **Motion Design Specialist** | Geçiş animasyonları, micro-interaction, sayfa girişleri, durum animasyonları |

---

## 2. Proje Bağlamı

**Ürün:** FinWise AI  
**Dil:** Türkçe  
**Tip:** AI destekli kişisel finans koçu — Full-Stack SaaS uygulaması

### Temel Özellikler

- Gelir, gider, borç, abonelik ve tasarruf hedefi yönetimi
- AI destekli bütçe planı, harcama analizi ve finansal sağlık skoru
- Borç farkındalık sistemi ve haftalık aksiyon planı
- PDF finans raporu oluşturma ve indirme
- Role-based admin paneli (kullanıcı, kategori, AI log, rapor, analitik yönetimi)

### Hedef Durum

> FinWise AI'yı hackathon finalinde jüriye gösterilebilecek — premium, güvenilir, modern ve finans odaklı bir SaaS ürününe dönüştür.

---

## 3. Kritik Kural: Mevcut Sistemi Bozma

### ❌ Kesinlikle Dokunulmaması Gerekenler

```
Backend logic             → Değiştirme
API endpoint'leri         → Değiştirme
Prisma schema             → Değiştirme
Database ilişkileri       → Değiştirme
Auth sistemi              → Değiştirme
Role-based authorization  → Değiştirme
AI servisleri             → Değiştirme
Finance engine            → Değiştirme
PDF generation logic      → Değiştirme
Mevcut business logic     → Değiştirme
Route path'leri           → Değiştirme
Form submit logic         → Değiştirme
Validation logic          → Değiştirme
Gerçek data akışı         → Mock ile değiştirme
```

### ✅ Yalnızca İyileştirilecekler

```
UI component kalitesi     → Yükselt
Layout                    → Modernize et
Görsel hiyerarşi          → Güçlendir
Tasarım sistemi           → Standardize et
Animasyonlar              → Ekle / Rafine et
Hover efektleri           → Uygula
Responsive davranış       → Düzelt / Test et
Accessibility             → İyileştir
Loading state             → Tasarla
Empty state               → Tasarla
Error state               → Tasarla
Görsel kalite             → Dashboard / Admin / App
```

---

## 4. Özerk Çalışma Talimatı

> **Benden sayfa adı bekleme. Benden onay isteme. Kendin analiz et, kendin karar ver, kendin uygula.**

### Analiz Aşaması (Başlamadan Önce)

1. Proje dosya yapısını tara
2. Tüm route'ları çıkar (public / auth / app / admin)
3. Mevcut component yapısını ve UI kütüphanelerini tespit et
4. Tailwind konfigürasyonunu ve design token'larını incele
5. Hangi sayfaların demo için kritik olduğunu belirle
6. Hangi sayfaların görsel olarak en zayıf olduğunu belirle
7. Hangi kütüphanenin hangi sayfada kullanılacağına karar ver
8. Uygulama planını oluştur ve paylaş
9. Batch 1'den itibaren otomatik olarak ilerle

---

## 5. Uygulama Öncelik Sırası

| # | Sayfa | Route | Öncelik |
|---|---|---|---|
| 1 | Landing Page | `/` | 🔴 Kritik |
| 2 | Login | `/auth/login` | 🔴 Kritik |
| 3 | Register | `/auth/register` | 🔴 Kritik |
| 4 | User Dashboard | `/app` | 🔴 Kritik |
| 5 | Onboarding | `/app/onboarding` | 🔴 Kritik |
| 6 | AI Finance Assistant | `/app/assistant` | 🔴 Kritik |
| 7 | Gelir Yönetimi | `/app/income` | 🟠 Yüksek |
| 8 | Gider Yönetimi | `/app/expenses` | 🟠 Yüksek |
| 9 | İşlemler | `/app/transactions` | 🟠 Yüksek |
| 10 | Analitik | `/app/analytics` | 🟠 Yüksek |
| 11 | Bütçe Planlayıcı | `/app/budget` | 🟠 Yüksek |
| 12 | Tasarruf Hedefleri | `/app/goals` | 🟡 Orta |
| 13 | Hedef Detayı | `/app/goals/[id]` | 🟡 Orta |
| 14 | Borç Yönetimi | `/app/debts` | 🟡 Orta |
| 15 | Abonelikler | `/app/subscriptions` | 🟡 Orta |
| 16 | Finansal Sağlık Skoru | `/app/health-score` | 🟡 Orta |
| 17 | Aksiyon Planı | `/app/action-plan` | 🟡 Orta |
| 18 | Raporlar | `/app/reports` | 🟡 Orta |
| 19 | Rapor Detayı | `/app/reports/[id]` | 🟡 Orta |
| 20 | Kullanıcı Ayarları | `/app/settings` | 🟡 Orta |
| 21 | Admin Dashboard | `/admin` | 🟠 Yüksek |
| 22 | Admin Kullanıcılar | `/admin/users` | 🟠 Yüksek |
| 23 | Admin Kategoriler | `/admin/categories` | 🟡 Orta |
| 24 | Admin AI Logları | `/admin/ai-logs` | 🔴 Kritik |
| 25 | Admin Raporlar | `/admin/reports` | 🟡 Orta |
| 26 | Admin Analitik | `/admin/analytics` | 🟠 Yüksek |
| 27 | Admin Ayarlar | `/admin/settings` | 🟡 Orta |
| 28 | Global App Shell | — | 🔴 Kritik |
| 29 | Responsive & A11y & Motion Polish | — | 🔴 Kritik |

> Projede bu route'lardan bir kısmı bulunmayabilir. Olmayan route'ları sıfırdan oluşturma zorunluluğun yok. Eksik olan ama ürün için kritik olan sayfaları tespit edersen, bana raporla.

---

## 6. Kütüphane Kullanım Stratejisi

### 6.1 Untitled UI React

**Kullanım Alanları:**
- Dashboard, admin panel, form bileşenleri
- Tablolar, veri listeleri, pagination
- Modal, drawer, dropdown, badge
- Input, select, tabs, tooltip
- Empty state, settings paneli
- Admin AI Logs, Admin Reports
- Transaction tablosu, budget planner
- Income / Expense CRUD ekranları

**Rol:** Projenin enterprise SaaS component foundation katmanı

**Sayfalar:**
`/app`, `/app/assistant`, `/app/income`, `/app/expenses`, `/app/transactions`, `/app/analytics`, `/app/budget`, `/app/goals`, `/app/debts`, `/app/subscriptions`, `/app/reports`, `/app/settings`, `/admin/*`, `/auth/login`, `/auth/register`

---

### 6.2 Magic UI

**Kullanım Alanları:**
- Landing page hero bölümü
- Feature section ve bento grid
- Border beam, animated gradient text
- Marquee, number ticker
- Trust strip, final CTA
- Product mockup showcase

**Rol:** Public/marketing sayfalarına premium görünüm kazandırmak

**Sayfalar:** `/` (ağırlıklı), `/auth/login` (çok hafif), `/auth/register` (çok hafif)

> ⚠️ Admin panelde Magic UI kullanma.

---

### 6.3 21st.dev

**Kullanım Alanları:**
- Layout referansı (header, sidebar, app shell)
- Hero ve dashboard card yapısı
- Feature grid ve product mockup
- Genel komponent kalitesi için referans

**Rol:** Modern React/Tailwind layout ve component kalitesi referansı

> Birebir kopyalama yapma. FinWise AI kimliğine uyarla.

---

### 6.4 Hover.dev

**Kullanım Alanları:**
- Button ve CTA hover efektleri
- Card hover interaksiyonları
- Sidebar item hover
- Transaction row, goal card, budget card, debt card hover
- Report card ve link hover

**Rol:** Micro-interaction kalitesini artırmak

**Animasyon Süresi:** 150ms – 250ms | Sade, hızlı, dikkat dağıtmayan

---

### 6.5 Motion.dev

**Kullanım Alanları:**
- Sayfa girişi (page entrance)
- Card stagger reveal animasyonları
- AI chat bubble animasyonu
- Chart ve progress bar reveal
- Budget / goal / health score progress animasyonu
- Checklist task completion animasyonu
- Modal, drawer, tab geçiş animasyonları
- Report card reveal

**Rol:** Projenin ana animasyon motoru

**Kurallar:**
- `opacity` ve `transform` kullan
- Layout shift oluşturma
- Reduced motion desteği ekle
- Admin panelde aşırı animasyondan kaçın

---

### 6.6 ReactBits

**Kullanım Alanları:**
- Landing hero animated text
- Hafif interactive background efektleri
- Empty state vurgu animasyonu
- Final CTA bölümü
- AI product showcase

**Rol:** Yalnızca vurgu gereken alanlarda premium efekt sağlamak

> ⚠️ Admin panelde kullanma. App sayfalarında minimum kullan.

---

## 7. Sayfa Türüne Göre Tasarım Kuralları

### 7.1 Public / Marketing Sayfaları

**Amaç:** İlk bakışta ürünün güçlü, güvenilir ve modern olduğunu hissettirmek.

**Kullanılacak Kütüphaneler:** Magic UI, ReactBits, Motion.dev, Hover.dev, 21st.dev ilhamı

**Landing Page Zorunlu Bölümleri:**

| Bölüm | İçerik |
|---|---|
| Header | Logo, navigasyon, CTA butonu |
| Hero | Başlık, alt başlık, CTA, product mockup |
| Product Mockup | AI chat, sağlık skoru, gelir/gider özeti, kategori grafiği, tasarruf hedefi, borç uyarısı, aksiyon planı, PDF indirme |
| Problem Section | Kullanıcının finansal sorunları |
| Solution Section | FinWise AI'ın çözümü |
| Features | Bento grid formatında özellikler |
| AI Finance Coach | AI özelliğinin öne çıkarılması |
| Health Score Showcase | 0-100 skor görseli |
| How It Works | 3-4 adımlı akış |
| Use Cases | Farklı kullanıcı profilleri |
| Security / Privacy | Veri güvenliği mesajı |
| Final CTA | Güçlü aksiyon çağrısı |
| Footer | Yasal uyarı + finansal sorumluluk reddi |

---

### 7.2 Auth Sayfaları

**Amaç:** Güvenli, sade, modern ve temiz görünüm. Güven hissi.

**Kullanılacak Kütüphaneler:** Untitled UI React, Motion.dev, Hover.dev, hafif Magic UI arkaplan

> Auth logic'e kesinlikle dokunma.

---

### 7.3 App Sayfaları (Kullanıcı Paneli)

**Amaç:**
- Kullanıcının parasının nereye gittiğini anlaması
- Gelir/gider dengesini net görmesi
- Bütçe planını takip etmesi
- Tasarruf hedeflerini yönetmesi
- Borç risklerini anlaması
- AI finans koçundan aksiyon alması
- PDF rapor indirebilmesi

**Kullanılacak Kütüphaneler:** Untitled UI React, Motion.dev, Hover.dev

---

### 7.4 Admin Sayfaları

**Amaç:** Denetlenebilirlik, veri yönetimi, kullanıcı takibi, AI log inceleme, sistem analitiği

**Kullanılacak Kütüphaneler:** Untitled UI React, Motion.dev, Hover.dev, mevcut chart kütüphanesi

**Kullanılmayacaklar:** Magic UI, ReactBits, fazla gradient, fazla glow, marketing efektleri

> Admin panel enterprise-grade ve ciddi görünmeli. Marketing havası yasak.

---

## 8. Tasarım Sistemi

### 8.1 Renk Paleti

| Kategori | Renk |
|---|---|
| **Ana Renk** | Deep Navy / Emerald |
| **Background** | White / Very Light Gray (`#F8FAFC`) |
| **Surface** | White |
| **Border** | Light Gray (`#E2E8F0`) |
| **Text Primary** | Near Black / Slate (`#0F172A`) |
| **Text Muted** | Gray (`#64748B`) |
| **Success** | Green (`#16A34A`) |
| **Warning** | Amber / Orange (`#F59E0B`) |
| **Risk / Error** | Red (`#DC2626`) |
| **Info** | Blue (`#2563EB`) |

### 8.2 Tipografi Kuralları

- Başlıklar: Güçlü, net, hiyerarşik
- Açıklamalar: Sade, okunabilir
- Label'lar: Net ve kısa
- Tablolar: Monospace tercih edilebilir, satır aralığı geniş
- **UI dili: Türkçe** — İngilizce metinlere geçme

### 8.3 Bileşen Stili

- Border radius: `12px` – `24px`
- Border: Thin, light gray
- Shadow: Soft, multi-layer (`shadow-sm` ila `shadow-md`)
- Spacing: Tutarlı `4px` grid sistemi
- Kart yapısı: Rounded, bordered, subtle shadow

### 8.4 Kaçınılacaklar

```
❌ Neon görünüm
❌ Aşırı gradient overlay
❌ Aşırı glow efektleri
❌ Oyun arayüzü hissi
❌ Karmaşık ve sürekli hareket eden animasyonlar
❌ Admin panelde marketing havası
❌ Copy-paste template görünümü
```

---

## 9. Animasyon Sistemi

### 9.1 Timing Referansları

| Animasyon Tipi | Süre |
|---|---|
| Page entrance | 180ms – 250ms |
| Card reveal | 200ms – 350ms |
| Stagger delay (kart arası) | 40ms – 80ms |
| Hover transition | 150ms – 200ms |
| Modal / Drawer | 180ms – 250ms |
| Progress bar fill | 400ms – 700ms |
| Number count-up | 600ms – 900ms |

### 9.2 Kullanılacak Özellikler

```css
opacity: 0 → 1
translateY: 8px → 0
scale: 0.98 → 1
width: 0% → %value (progress)
```

### 9.3 Reduced Motion

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
Reduced motion aktifse tüm animasyonları `duration: 0` veya `opacity-only` moduna al.

### 9.4 Yasaklar

```
❌ Heavy bounce / spring
❌ 500ms+ geçiş animasyonları
❌ Sürekli dönen / yanıp sönen elementler
❌ Layout shift yaratan animasyonlar
❌ GPU yoğun particle sistemleri
❌ Admin panelde aşırı animasyon
```

---

## 10. Component Mimarisi

### Önerilen Klasör Yapısı

```
components/
├── marketing/
│   ├── MagicHero.tsx
│   ├── FeatureBentoGrid.tsx
│   ├── ProductMockup.tsx
│   ├── TrustStrip.tsx
│   ├── HowItWorks.tsx
│   └── FinalCTA.tsx
├── layout/
│   ├── AppShell.tsx
│   ├── AdminShell.tsx
│   ├── Sidebar.tsx
│   └── TopBar.tsx
├── assistant/
│   ├── ChatPanel.tsx
│   ├── ChatBubble.tsx
│   └── FinanceInsightPanel.tsx
├── dashboard/
│   ├── StatsCard.tsx
│   ├── HealthScoreCard.tsx
│   ├── QuickActionBar.tsx
│   └── WelcomeBanner.tsx
├── finance/
│   ├── TransactionTable.tsx
│   ├── CategoryBadge.tsx
│   └── AmountDisplay.tsx
├── budget/
│   ├── BudgetProgressCard.tsx
│   └── BudgetLimitWarning.tsx
├── goals/
│   ├── GoalCard.tsx
│   └── GoalProgressBar.tsx
├── debt/
│   ├── DebtRiskCard.tsx
│   └── DebtSummaryBadge.tsx
├── reports/
│   ├── ReportCard.tsx
│   └── ReportDownloadButton.tsx
├── admin/
│   ├── AILogTable.tsx
│   ├── UserTable.tsx
│   └── AdminStatCard.tsx
├── motion/
│   ├── MotionPage.tsx
│   ├── MotionCard.tsx
│   └── MotionList.tsx
└── ui/
    ├── EmptyState.tsx
    ├── LoadingState.tsx
    └── ErrorState.tsx
```

### Component Kuralları

- Sayfa dosyalarını şişirme → reusable component oluştur
- Duplicate component üretme → mevcut olanı yeniden kullan
- Kullanılmayan import bırakma
- TypeScript hatası bırakma
- Bileşen isimleri anlaşılır ve tutarlı olsun

---

## 11. Batch Çalışma Planı

### Batch 1 — Temel & Marketing
```
- Global design token ve Tailwind konfigürasyonu
- Global App Shell (layout, sidebar, topbar)
- Landing Page (/)
- Login (/auth/login)
- Register (/auth/register)
```

### Batch 2 — Kullanıcı Paneli Çekirdeği
```
- Dashboard (/app)
- AI Assistant (/app/assistant)
- Onboarding (/app/onboarding)
- Analytics (/app/analytics)
```

### Batch 3 — Finans Modülleri
```
- Income (/app/income)
- Expenses (/app/expenses)
- Transactions (/app/transactions)
- Budget (/app/budget)
- Goals (/app/goals + /app/goals/[id])
```

### Batch 4 — Tamamlayıcı Modüller
```
- Debts (/app/debts)
- Subscriptions (/app/subscriptions)
- Health Score (/app/health-score)
- Action Plan (/app/action-plan)
- Reports (/app/reports + /app/reports/[id])
- Settings (/app/settings)
```

### Batch 5 — Admin Paneli
```
- Admin Dashboard (/admin)
- Admin Users (/admin/users)
- Admin Categories (/admin/categories)
- Admin AI Logs (/admin/ai-logs)
- Admin Reports (/admin/reports)
- Admin Analytics (/admin/analytics)
- Admin Settings (/admin/settings)
```

### Batch 6 — Final Polish
```
- Responsive cleanup (mobile / tablet)
- Accessibility audit (ARIA, contrast, focus)
- Motion consistency cleanup
- Design token tutarlılığı
- Son genel kalite kontrolü
```

---

### Her Batch Sonunda Yapılacaklar

Her batch tamamlandıktan sonra şu raporu sun:

```markdown
## Batch [N] Tamamlandı

### Değiştirilen Dosyalar
- [dosya yolu] — [değişiklik özeti]

### Yapılan İyileştirmeler
- [iyileştirme 1]
- [iyileştirme 2]

### Kullanılan Kütüphaneler
- [kütüphane] → [hangi sayfada / bileşende]

### Build / TypeCheck Notları
- [gerekli komut ya da dikkat edilmesi gereken]

### Kalan İşler
- [eksik kalan şey varsa]

### Sonraki Batch
[Otomatik olarak devam et]
```

---

## 12. Sayfa Bazlı Kalite Hedefleri

### Landing Page
Premium startup landing page estetiği. Jüri ilk bakışta ürünün değerini anlamalı. Hero product mockup'ı gerçek özellikleri göstermeli.

### Login / Register
Sade, güvenli, temiz. Finansal ürün güveni hissettirmeli. Form logic'e dokunma.

### Dashboard
Kullanıcı gelirini, giderini, kalan parasını, finansal sağlık skorunu ve hedef durumunu **ilk bakışta** görmelidir.

### AI Assistant
Ürünün ana değeri burada. Chat panel ve structured finance insight paneli arasındaki ayrım çok net olmalı.

### Onboarding
Akıcı, adım adım, kullanıcıya yük olmayan bir profil oluşturma deneyimi. Aylık gelir, giderler, borç, hedef, risk toleransı.

### Analytics
Harcama grafikleri, kategori dağılımı ve AI yorum kartları okunabilir ve anlaşılır olmalı.

### Budget
Planlanan bütçe ↔ gerçekleşen harcama farkı net görünmeli. Limit aşımı uyarıları kaliteli tasarlanmalı.

### Goals
Motive edici, ölçülebilir, takip edilebilir hedef kartları.

### Debts
Borç riski ciddi ama panik yaratmadan, bilgi odaklı anlatılmalı.

### Subscriptions
Abonelik maliyetleri ve potansiyel tasarruf fırsatları net görünmeli.

### Health Score
0–100 finansal sağlık skoru, premium bir skor kartı / endeks gibi görünmeli.

### Action Plan
Haftalık görevler uygulanabilir, sade, takip edilebilir ve tamamlama animasyonlu olmalı.

### Reports
Profesyonel bir finansal danışman raporu estetiği. PDF çıktısı sunan bir arayüz gibi görünmeli.

### Admin Dashboard
Enterprise SaaS admin panel kalitesi. Tüm sistem metriklerini bir bakışta sunan layout.

### Admin AI Logs
AI denetim sistemi ciddi ve güvenilir görünmeli. **Bu sayfa jüri için çok önemli.**

### Admin Analytics
Kullanıcı büyümesi, AI istek hacmi, rapor üretimi ve sağlık skoru trendleri net görünmeli.

---

## 13. Kalite Kontrol Listesi

Her sayfa teslim edilmeden önce aşağıdakileri kontrol et:

```
[ ] Görsel hiyerarşi güçlü mü?
[ ] Sayfanın amacı ilk bakışta anlaşılıyor mu?
[ ] Türkçe metinler doğru ve tutarlı mı?
[ ] Responsive düzgün çalışıyor mu? (mobile + tablet + desktop)
[ ] Button ve input'lar tasarım sistemiyle tutarlı mı?
[ ] Loading state tanımlı mı?
[ ] Empty state tanımlı mı?
[ ] Error state tanımlı mı?
[ ] Hover state'ler var mı?
[ ] Motion sade ve anlamlı mı?
[ ] Finansal ürün ciddiyeti korunuyor mu?
[ ] AI ürünü premium hissediliyor mu?
[ ] Admin panel enterprise-grade görünüyor mu?
[ ] Gereksiz import/dependency var mı?
[ ] TypeScript hataları temizlendi mi?
[ ] ARIA label'ları ve erişilebilirlik eklendi mi?
[ ] Renk kontrastı WCAG AA uyumlu mu?
```

---

## 14. Finansal Sorumluluk Uyarısı

Aşağıdaki sayfalarda küçük, sade ve rahatsız etmeyen bir sorumluluk reddi metni görünmeli:

> *"FinWise AI kişisel bütçe ve finansal farkındalık desteği sağlar. Yatırım tavsiyesi vermez."*

**Zorunlu Sayfalar:**
- AI Assistant (`/app/assistant`)
- Raporlar (`/app/reports`)
- Finansal Sağlık Skoru (`/app/health-score`)
- Borç Yönetimi (`/app/debts`)
- Landing Page footer

**Stil:** `text-xs text-muted`, footer veya info banner içinde. Dikkat dağıtmamalı.

---

## 15. Kesinlikle Yapılmayacaklar

```
❌ Projeyi rastgele baştan sona yeniden yazma
❌ Backend, API, Prisma, auth logic'e dokunma
❌ Çalışan feature'ları kaldırma
❌ Form submit logic'i bozma
❌ Gerçek data akışını mock ile değiştirme
❌ Her sayfaya aynı efektleri kopyala-yapıştır yapma
❌ Admin paneli landing page gibi tasarlama
❌ Her yere glow / gradient koyma
❌ UI dilini İngilizceye çevirme
❌ Kırık import bırakma
❌ Kullanılmayan bileşen veya dependency bırakma
❌ Aşırı animasyon kullanma
❌ Responsive düzeni bozma
❌ Accessibility'i görmezden gelme
❌ Jenerik template görünümü
❌ Hisse, kripto, al/sat, yatırım yönlendirmesi gibi mesajlar içeren UI metinleri ekleme
```

---

## 16. Başlangıç Talimatı

**Şimdi benden herhangi bir şey istemeden çalışmaya başla.**

Adımlar:

1. Projenin tüm dosya yapısını tara
2. Route'ları ve sayfa listesini çıkar
3. Mevcut UI durumunu değerlendir
4. Kütüphane haritasını oluştur
5. Uygulama planını paylaş
6. **Batch 1'den itibaren otomatik olarak ilerle**

---

*Son güncelleme: FinWise AI Hackathon Versiyonu — Profesyonel UI/UX İyileştirme Kılavuzu*
