import Link from 'next/link'
import { Suspense } from 'react'
import { HeroMockup } from '@/components/hero-mockup'
import { Icon, type IconName } from '@/components/icons'
import { ProductCard } from '@/components/product-card'
import { BRAND } from '@/lib/brand'
import { getProducts } from '@/lib/products'

const HIGHLIGHTS: { icon: IconName; label: string }[] = [
  { icon: 'card', label: 'Pagamento via Stripe' },
  { icon: 'lock', label: 'Login seguro com Clerk' },
  { icon: 'cart', label: 'Carrinho sempre atualizado' },
  { icon: 'mail', label: 'Confirmação por e-mail' },
  { icon: 'box', label: 'Estoque conferido a cada compra' },
]

const TRUST = ['Pagamento via Stripe', 'Login com Clerk', 'Confirmação por e-mail']

export default function Home() {
  return (
    <main>
      <Hero />
      <HighlightsStrip />
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Novidades
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Acabou de chegar
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-slate-500 transition-all duration-300 hover:text-indigo-600"
          >
            Ver todos →
          </Link>
        </div>
        <Suspense fallback={<FeaturedSkeleton />}>
          <Featured />
        </Suspense>
      </section>
      <Bento />
      <FinalCta />
    </main>
  )
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="mesh" aria-hidden>
        <div className="blob -left-24 -top-24 h-96 w-96 bg-indigo-400" />
        <div
          className="blob -right-16 top-10 h-[28rem] w-[28rem] bg-violet-400"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="blob bottom-0 left-1/3 h-72 w-72 bg-pink-300"
          style={{ animationDelay: '-12s' }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-28 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Loja de demonstração • Pagamentos em modo de teste
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Seu próximo favorito está <span className="text-gradient">a um clique.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
            Explore o catálogo, monte o carrinho e pague com segurança. Cada
            pedido é acompanhado até a confirmação do pagamento.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="btn btn-primary !px-8 !py-4 text-base hover:-translate-y-0.5"
            >
              Ver produtos
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/orders"
              className="btn btn-secondary !border-slate-300 !px-8 !py-4 text-base hover:-translate-y-0.5"
            >
              Meus pedidos
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icon name="check" className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:200ms]">
          <HeroMockup />
        </div>
      </div>
    </section>
  )
}

/* ---------- Faixa de diferenciais ---------- */

function HighlightsStrip() {
  const items = [...HIGHLIGHTS, ...HIGHLIGHTS]

  return (
    <div
      className="marquee overflow-hidden border-y border-slate-200/70 bg-white/50 py-5 backdrop-blur"
      aria-label="Diferenciais da loja"
    >
      <div className="marquee-track">
        {items.map((item, i) => (
          <div
            key={i}
            aria-hidden={i >= HIGHLIGHTS.length}
            className="flex items-center gap-8 whitespace-nowrap pr-8 text-sm font-medium text-slate-600"
          >
            <span className="flex items-center gap-3">
              <Icon name={item.icon} className="h-4 w-4 text-indigo-500" />
              {item.label}
            </span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Novidades ---------- */

async function Featured() {
  const { data } = await getProducts({ limit: 4 })

  if (data.length === 0) {
    return (
      <p className="text-slate-500">
        Nenhum produto cadastrado ainda. Volte em breve.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}

function FeaturedSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-72" />
      ))}
    </div>
  )
}

/* ---------- Como funciona (bento) ---------- */

function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-10 max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Como funciona
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Do carrinho ao pedido, sem surpresas
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. Stripe */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-violet-700 p-8 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:col-span-2 md:p-10">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
                Pagamento
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Pague na página segura do Stripe
              </h3>
              <p className="mt-3 max-w-md text-white/80">
                O pagamento acontece fora da loja: a gente nunca vê os dados do
                seu cartão.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                  •••• 4242
                </span>
                <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                  Modo de teste
                </span>
              </div>
            </div>

            <div aria-hidden className="hidden justify-center md:flex">
              <div className="w-64 rotate-3 rounded-2xl border border-white/25 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
                  <Icon name="card" className="h-5 w-5 text-white/70" />
                </div>
                <p className="mt-8 text-lg font-semibold tracking-widest">
                  •••• •••• •••• 4242
                </p>
                <div className="mt-4 flex justify-between text-xs text-white/70">
                  <span>Checkout Stripe</span>
                  <span>12/34</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Clerk */}
        <div className="card flex flex-col p-8 hover:-translate-y-1 hover:shadow-md">
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"
          >
            <Icon name="lock" className="h-5 w-5" />
          </span>
          <h3 className="mt-6 text-xl font-semibold">Conta protegida</h3>
          <p className="mt-2 text-sm text-slate-500">
            Login e cadastro pelo Clerk. Seu carrinho e seus pedidos são só seus.
          </p>

          <div aria-hidden className="mt-auto space-y-3 pt-8">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Icon name="user" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Sessão ativa</p>
                <p className="truncate text-xs text-slate-500">
                  Autenticado com Clerk
                </p>
              </div>
              <span className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Icon name="shield" className="h-4 w-4" />
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                Carrinho privado
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                Pedidos privados
              </span>
            </div>
          </div>
        </div>

        {/* 3. Pedido acompanhado */}
        <div className="card flex flex-col p-8 hover:-translate-y-1 hover:shadow-md">
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"
          >
            <Icon name="box" className="h-5 w-5" />
          </span>
          <h3 className="mt-6 text-xl font-semibold">Pedido acompanhado</h3>
          <p className="mt-2 text-sm text-slate-500">
            O status muda para pago assim que o pagamento é confirmado, sem
            precisar recarregar a página.
          </p>

          <div aria-hidden className="mt-auto pt-8">
            <div className="flex items-center">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-500 text-white">
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              <span className="h-0.5 flex-1 bg-gradient-to-r from-indigo-500 to-indigo-400" />
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400 text-white">
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              <span className="h-0.5 flex-1 bg-gradient-to-r from-indigo-400 to-emerald-400" />
              <span className="relative grid h-6 w-6 shrink-0 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 text-xs text-slate-500">
              <span>Criado</span>
              <span className="text-center">Processando</span>
              <span className="text-right font-semibold text-emerald-600">
                Pago ✓
              </span>
            </div>
          </div>
        </div>

        {/* 4. E-mail */}
        <div className="card relative flex flex-col overflow-hidden p-8 hover:-translate-y-1 hover:shadow-md md:col-span-2 md:p-10">
          <div
            aria-hidden
            className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300 to-teal-300 opacity-40 blur-3xl"
          />
          <p className="relative text-sm font-semibold uppercase tracking-widest text-emerald-600">
            E-mail
          </p>
          <h3 className="relative mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Confirmação na sua caixa de entrada
          </h3>
          <p className="relative mt-3 max-w-md text-slate-600">
            Quando o pagamento é aprovado, você recebe o resumo da compra por
            e-mail.
          </p>

          <div aria-hidden className="relative mt-auto pt-8">
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white">
                  {BRAND.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Resumo do Pedido #1024 · Confirmado
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {BRAND.name} · agora mesmo
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Pago
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-3/4 rounded-full bg-slate-100" />
                <div className="h-2 w-full rounded-full bg-slate-100" />
                <div className="h-2 w-1/2 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Banner final ---------- */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 text-center text-white sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(124,58,237,0.35),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(40%_50%_at_90%_100%,rgba(99,102,241,0.25),transparent_70%)]"
        />
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Pronto para fazer um{' '}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            pedido de teste
          </span>
          ?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          Escolha um produto, finalize com o cartão de teste e veja o status
          virar pago.
        </p>
        <Link
          href="/products"
          className="btn mt-10 bg-white !px-8 !py-4 text-base text-slate-950 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
        >
          Explorar produtos
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}