'use client'

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: number
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled
      data-product-id={productId}
      title={disabled ? 'Produto esgotado' : 'O carrinho entra no próximo passo'}
      className="mt-2 rounded bg-black px-4 py-3 text-white disabled:opacity-50"
    >
      {disabled ? 'Esgotado' : 'Adicionar ao carrinho'}
    </button>
  )
}