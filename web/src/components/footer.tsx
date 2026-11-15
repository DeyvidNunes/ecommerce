import Link from 'next/link'
import { Logo } from '@/components/logo'
import { BRAND } from '@/lib/brand'

const PROJECT_LINKS = [
  { href: '/products', label: 'Produtos' },
  { href: '/cart', label: 'Carrinho' },
  { href: '/orders', label: 'Meus pedidos' },
]

const TECH = [
  'Next.js e Tailwind CSS',
  'NestJS e TypeORM',
  'PostgreSQL no Supabase',
  'Clerk, autenticação',
  'Stripe, pagamentos',
  'Resend, e-mails',
]

const linkClass = 'transition-all duration-300 hover:text-indigo-600'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-slate-500">
            {BRAND.description}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-500">
            {PROJECT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={BRAND.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Código no GitHub
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Tecnologias</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            {TECH.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Créditos</h2>
          <p className="mt-4 text-sm text-slate-500">
            Desenvolvido por{' '}
            <a
              href={BRAND.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 transition-all duration-300 hover:text-indigo-600"
            >
              {BRAND.author}
            </a>
            .
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Projeto de portfólio, sem vendas reais. Pagamentos em modo de teste.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-500">
            <li>
              <a
                href={BRAND.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                GitHub
              </a>
            </li>
            {BRAND.linkedinUrl && (
              <li>
                <a
                  href={BRAND.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  )
}