import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-2xl font-bold">CarParty</span>
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
        >
          Войти
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="max-w-3xl text-5xl font-bold leading-tight">
          Пригон, разборка и ремонт автомобилей из США
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Полный цикл: от торгов на Copart до продажи восстановленного авто и запчастей.
          CRM, аналитика и личные кабинеты для клиентов и команды.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            { title: 'Пригон', desc: 'Подбор, торги, доставка, таможня' },
            { title: 'Разборка', desc: 'Каталог запчастей, склад, продажа' },
            { title: 'Сервис', desc: 'Кузовной и механический ремонт' },
            { title: 'Продажа', desc: 'Авто под ключ, аналитика просмотров' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl bg-white/10 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
