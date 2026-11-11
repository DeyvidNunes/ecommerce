'use client'

import Image from 'next/image'
import { useState } from 'react'

const IMAGES_HOST = process.env.NEXT_PUBLIC_IMAGES_HOST

// O Next lança erro para domínios não liberados; aqui só usamos o nosso
function isAllowed(src: string) {
  try {
    return Boolean(IMAGES_HOST) && new URL(src).hostname === IMAGES_HOST
  } catch {
    return false
  }
}

export function ProductImage({
  src,
  name,
  alt = name,
  sizes,
  className = '',
  letterClassName = 'text-5xl',
}: {
  src: string | null
  name: string
  alt?: string
  sizes: string
  className?: string
  letterClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && isAllowed(src as string) && !failed

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-500 ${className}`}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes={sizes}
          onError={() => setFailed(true)}
          className="object-cover transition-all duration-500 group-hover:scale-105"
        />
      ) : (
        <span
          aria-hidden
          className={`absolute inset-0 grid place-items-center font-bold text-white/90 ${letterClassName}`}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}