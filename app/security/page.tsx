export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Güvenlik</h1>
        <p className="text-sm leading-7 text-slate-600">
          FinWise AI oturum doğrulaması, rol tabanlı erişim ve kullanıcı bazlı veri izolasyonu kullanır. Kişisel
          finans verileri yalnızca ilgili kullanıcıya gösterilir.
        </p>
        <p className="text-sm leading-7 text-slate-600">
          İsterseniz iki faktörlü doğrulama ve oturum yönetimi ayarları hesabınız üzerinden kontrol edilebilir.
        </p>
      </div>
    </main>
  );
}
