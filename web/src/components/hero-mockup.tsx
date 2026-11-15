import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/icons'
import { formatPrice } from '@/lib/format'

export function HeroMockup() {
  return (
    <div
      role="group"
      aria-label="Produto em destaque"
      className="relative mx-auto w-full max-w-sm pb-16 pt-10"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
        <div className="relative h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500">
          <Image
            src="/hero-product.webp"
            alt="Fone Pro"
            fill
            priority
            sizes="(min-width: 400px) 344px, 90vw"
            className="object-cover"
          />
        </div>

        <div className="mt-5">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            Áudio
          </span>
          <h3 className="mt-2 text-lg font-semibold">Fone Pro</h3>
          <p className="text-sm text-slate-500">
            Sem fio, com cancelamento de ruído
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="whitespace-nowrap text-2xl font-bold tracking-tight">
            {formatPrice(34990)}
          </p>
          <Link
            href="/products?search=Fone%20Pro"
            className="btn btn-primary shrink-0 !px-4 !py-2.5 text-sm"
          >
            Ver no catálogo
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Notificação de pagamento, acima do card */}
      <div className="animate-float absolute right-0 top-0 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
        >
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold">Pagamento confirmado</p>
          <p className="text-xs text-slate-500">Pedido #1024</p>
        </div>
      </div>

      {/* Resumo do carrinho, abaixo do card */}
      <div className="animate-float-slow absolute bottom-0 left-0 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white"
        >
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