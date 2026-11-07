const STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Aguardando pagamento',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  paid: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  canceled: {
    label: 'Cancelado',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const style = STATUS[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  )
}