import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${BRAND.name}, página inicial`}
      className={`group inline-flex items-center gap-2 ${className}`}
    >
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-extrabold text-white shadow-md transition-all duration-300 group-hover:rotate-6 group-hover:scale-105"
      >
        {BRAND.name.charAt(0)}
      </span>
      <span className="text-xl font-bold tracking-tight">{BRAND.name}</span>
    </Link>
  )
}