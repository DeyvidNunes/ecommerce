import Link from 'next/link'
import { Suspense } from 'react'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/products'

const HIGHLIGHTS = [
  'Pagamento via Stripe',
  'Login seguro com Clerk',
  'Carrinho sempre atualizado',
  'Confirmação por e-mail',
  'Estoque conferido a cada compra',
]

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
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
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

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-32 lg:pt-24">
        <div className="animate-fade-up">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Loja de demonstração · pagamentos em modo de teste
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Seu próximo favorito está{' '}
            <span className="text-gradient">a um clique</span>.
          </h1>

          <p className="mt-6 max-w-lg text-lg text-slate-600">
            Explore o catálogo, monte o carrinho e pague com segurança. Cada
            pedido é acompanhado até a confirmação do pagamento.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/products" className="btn btn-primary !px-8 !py-4 text-base">
              Ver produtos →
            </Link>
            <Link href="/orders" className="btn btn-secondary !px-8 !py-4 text-base">
              Meus pedidos
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {['Pagamento via Stripe', 'Login com Clerk', 'Confirmação por e-mail'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}

function HeroVisual() {
  return (
    <div
      aria-hidden
      className="animate-fade-up relative mx-auto h-[26rem] w-full max-w-md [animation-delay:200ms] sm:h-[30rem]"
    >
      {/* Cartão de produto (ilustrativo) */}
      <div className="glass absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-3xl p-4 transition-all duration-500 hover:rotate-0 hover:scale-105 sm:w-72">
        <div className="grid h-44 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 sm:h-52">
          <span className="text-6xl font-bold text-white/90">P</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-2/3 rounded-full bg-slate-900/10" />
          <div className="h-3 w-1/3 rounded-full bg-slate-900/5" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">R$ 49,90</span>
          <span className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg">
            Adicionar
          </span>
        </div>
      </div>

      {/* Notificação de pagamento (ilustrativa) */}
      <div className="glass animate-float absolute right-0 top-4 flex items-center gap-3 rounded-2xl px-4 py-3 sm:-right-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold">Pagamento confirmado</p>
          <p className="text-xs text-slate-500">Pedido #1024</p>
        </div>
      </div>

      {/* Resumo do carrinho (ilustrativo) */}
      <div className="glass animate-float-slow absolute bottom-6 left-0 flex items-center gap-3 rounded-2xl px-4 py-3 sm:-left-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
          3
        </span>
        <div>
          <p className="text-sm font-semibold">No carrinho</p>
          <p className="text-xs text-slate-500">Pronto para finalizar</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- Faixa rolante ---------- */

function HighlightsStrip() {
  const items = [...HIGHLIGHTS, ...HIGHLIGHTS]
  return (
    <div
      className="marquee overflow-hidden border-y border-slate-200/70 bg-white/60 py-4 backdrop-blur"
      aria-label="Destaques da loja"
    >
      <div className="marquee-track">
        {items.map((item, i) => (
          <span
            key={i}
            aria-hidden={i >= HIGHLIGHTS.length}
            className="mx-8 flex items-center gap-8 whitespace-nowrap text-sm font-medium text-slate-500"
          >
            {item}
            <span aria-hidden className="text-indigo-400">
              ✦
            </span>
          </span>
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
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
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

/* ---------- Grade bento ---------- */

function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-10 max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Como funciona
        </p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
          Do carrinho ao pedido, sem surpresas
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tile grande, escuro */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl md:col-span-2 md:p-10">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:scale-125"
          />
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Pagamento
          </p>
          <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
            Pague na página segura do Stripe
          </h3>
          <p className="mt-3 max-w-md text-white/80">
            O pagamento acontece fora da loja: a gente nunca vê os dados do seu
            cartão.
          </p>
          <div aria-hidden className="mt-8 flex gap-3">
            <span className="glass rounded-xl !border-white/20 !bg-white/10 px-4 py-2 text-sm text-white">
              •••• 4242
            </span>
            <span className="glass rounded-xl !border-white/20 !bg-white/10 px-4 py-2 text-sm text-white">
              Modo de teste
            </span>
          </div>
        </div>

        <div className="card p-8 hover:scale-[1.02] hover:shadow-md">
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600"
          >
            ◉
          </span>
          <h3 className="mt-6 text-xl font-semibold">Conta protegida</h3>
          <p className="mt-2 text-sm text-slate-500">
            Login e cadastro pelo Clerk. Seu carrinho e seus pedidos são só seus.
          </p>
        </div>

        <div className="card p-8 hover:scale-[1.02] hover:shadow-md">
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl text-violet-600"
          >
            ◷
          </span>
          <h3 className="mt-6 text-xl font-semibold">Pedido acompanhado</h3>
          <p className="mt-2 text-sm text-slate-500">
            O status muda para pago assim que o pagamento é confirmado, sem
            precisar recarregar a página.
          </p>
        </div>

        <div className="glass relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] md:col-span-2 md:p-10">
          <div
            aria-hidden
            className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300 to-teal-300 opacity-50 blur-3xl"
          />
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            E-mail
          </p>
          <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
            Confirmação na sua caixa de entrada
          </h3>
          <p className="mt-3 max-w-md text-slate-600">
            Quando o pagamento é aprovado, você recebe o resumo da compra por
            e-mail.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- Chamada final ---------- */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-violet-500/40 blur-3xl" />
        </div>
        <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-5xl">
          Pronto para fazer um <span className="text-gradient">pedido de teste</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          Escolha um produto, finalize com o cartão de teste e veja o status
          virar pago.
        </p>
        <Link
          href="/products"
          className="btn mt-8 bg-white !px-8 !py-4 text-base text-slate-900 shadow-lg hover:shadow-xl"
        >
          Explorar produtos →
        </Link>
      </div>
    </section>
  )
}