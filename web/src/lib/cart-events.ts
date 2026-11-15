export const CART_CHANGED_EVENT = 'cart:changed'

// Avisa o cabeçalho para atualizar o contador do carrinho
export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT))
}