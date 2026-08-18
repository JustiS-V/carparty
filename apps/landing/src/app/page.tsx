import Link from 'next/link';

const productUrl = process.env.NEXT_PUBLIC_PRODUCT_URL ?? 'http://localhost:3000';
const botUrl = process.env.NEXT_PUBLIC_BOT_URL ?? 'https://t.me/your_bot';

const features = [
  {
    title: 'Telegram, OLX, AUTO.RIA',
    desc: 'Збираємо оголошення з популярних джерел і каналів перекупів — ви бачите ринок в одному місці.',
  },
  {
    title: 'Миттєві сповіщення',
    desc: 'Нове авто за вашим фільтром — push у Telegram за секунди, без ручного моніторингу.',
  },
  {
    title: 'Фільтри під себе',
    desc: 'Марка, модель, бюджет, місто — налаштуйте один раз і отримуйте лише релевантні лоти.',
  },
  {
    title: 'PRO підписка',
    desc: 'Trial 48 годин безкоштовно. Оплата через LiqPay або Monobank — без зайвих кроків.',
  },
];

const plans = [
  {
    name: 'FREE',
    price: '0 ₴',
    period: 'назавжди',
    perks: ['Базові сповіщення', '1 фільтр', 'Telegram-бот'],
  },
  {
    name: 'PRO',
    price: '299 ₴',
    period: '/ міс',
    perks: ['Необмежені фільтри', 'Пріоритетні push', 'Розширена аналітика', 'Trial 48 год'],
    highlight: true,
  },
];

const steps = [
  { n: '1', title: 'Відкрийте бота', desc: 'Запустіть Telegram-бота та оберіть мову.' },
  { n: '2', title: 'Налаштуйте фільтр', desc: 'Марка, бюджет, регіон — все в кілька кліків.' },
  { n: '3', title: 'Отримуйте лоти', desc: 'Нові оголошення приходять одразу, поки ви займаєтесь справами.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-2xl font-bold tracking-tight">CarParty</span>
        <nav className="flex items-center gap-4">
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-slate-300 hover:text-white sm:inline"
          >
            Telegram-бот
          </a>
          <Link
            href={productUrl}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
          >
            Увійти в кабінет
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-12">
          <div className="max-w-3xl">
            <p className="mb-4 inline-block rounded-full bg-brand-600/20 px-3 py-1 text-sm text-brand-100">
              Моніторинг авто-ринку України
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Не пропустіть вигідне авто — сповіщення в Telegram
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              CarParty збирає оголошення з Telegram-каналів, OLX та AUTO.RIA і надсилає вам лише
              те, що відповідає вашим фільтрам. Для перекупів, дилерів і всіх, хто шукає авто швидко.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-brand-600 px-6 py-3 font-semibold hover:bg-brand-700"
              >
                Спробувати в Telegram
              </a>
              <Link
                href={`${productUrl}/login`}
                className="rounded-xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/10"
              >
                Веб-кабінет
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/5 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div key={item.title} className="rounded-xl bg-white/5 p-6">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">Як це працює</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-white/5 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold">Тарифи</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-3xl">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-8 ${
                    plan.highlight
                      ? 'border-2 border-brand-500 bg-brand-600/10'
                      : 'border border-white/10 bg-white/5'
                  }`}
                >
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-slate-400"> {plan.period}</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-slate-300">
                    {plan.perks.map((perk) => (
                      <li key={perk}>✓ {perk}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">Готові почати?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            48 годин PRO безкоштовно — перевірте, як швидко знаходяться потрібні лоти.
          </p>
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-xl bg-brand-600 px-8 py-4 text-lg font-semibold hover:bg-brand-700"
          >
            Відкрити бота в Telegram
          </a>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} CarParty. Моніторинг авто-оголошень в Україні.</p>
      </footer>
    </div>
  );
}
