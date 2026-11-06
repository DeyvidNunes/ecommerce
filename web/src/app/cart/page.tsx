"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/api-error";
import { formatPrice } from "@/lib/format";
import type { Cart, CartItem, CheckoutResponse } from "@/lib/types";

const MAX_QUANTITY = 99;

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Erro inesperado";
}

export default function CartPage() {
  const api = useApi();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | "all" | "checkout" | null>(null);

  const load = useCallback(async () => {
    try {
      setCart(await api<Cart>("/cart"));
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  // Se o usuário voltar do Stripe pelo botão do navegador, destrava a tela
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function checkout() {
    setBusy("checkout");
    setActionError(null);
    try {
      const { checkoutUrl } = await api<CheckoutResponse>("/orders/checkout", {
        method: "POST",
      });

      // Só redireciona para o domínio do Stripe
      if (!new URL(checkoutUrl).hostname.endsWith(".stripe.com")) {
        throw new Error("URL de pagamento inesperada");
      }

      window.location.assign(checkoutUrl);
      // Não destrava o botão: a página vai ser trocada pelo Stripe
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.status === 429
            ? "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."
            : error.message
          : "Não foi possível iniciar o pagamento.",
      );
      setBusy(null);
    }
  }

  // Executa a mudança e recarrega o carrinho, sem depender do formato da resposta
  async function mutate(
    target: number | "all",
    request: () => Promise<unknown>,
  ) {
    setBusy(target);
    setActionError(null);
    try {
      await request();
      await load();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  const changeQuantity = (item: CartItem, quantity: number) =>
    mutate(item.id, () =>
      api(`/cart/items/${item.id}`, { method: "PATCH", body: { quantity } }),
    );

  const removeItem = (item: CartItem) =>
    mutate(item.id, () => api(`/cart/items/${item.id}`, { method: "DELETE" }));

  const clearCart = () => {
    if (!window.confirm("Esvaziar o carrinho?")) return;
    mutate("all", () => api("/cart", { method: "DELETE" }));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Seu carrinho</h1>
          {cart && cart.items.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {cart.totalItems} {cart.totalItems === 1 ? "item" : "itens"}
            </p>
          )}
        </div>
        {cart && cart.items.length > 0 && (
          <button
            onClick={clearCart}
            disabled={busy !== null}
            className="btn btn-ghost"
          >
            Esvaziar carrinho
          </button>
        )}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <CartSkeleton />
      ) : loadError ? (
        <div className="card mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold">Não foi possível carregar</h2>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="btn btn-primary mt-6"
          >
            Tentar novamente
          </button>
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <div
            aria-hidden
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl text-white"
          >
            ✦
          </div>
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-sm text-slate-500">
            Que tal explorar o catálogo e escolher algo?
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="flex flex-col gap-4">
            {cart.items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                disabled={busy !== null}
                loading={busy === item.id || busy === "all"}
                onChange={(quantity) => changeQuantity(item, quantity)}
                onRemove={() => removeItem(item)}
              />
            ))}
          </ul>

          <aside className="glass rounded-3xl p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Resumo do pedido</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Itens</dt>
                <dd className="font-medium">{cart.totalItems}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium">
                  {formatPrice(cart.totalInCents)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex items-baseline justify-between border-t border-slate-200/70 pt-6">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-bold tracking-tight">
                {formatPrice(cart.totalInCents)}
              </span>
            </div>
            <button
              onClick={checkout}
              disabled={busy !== null}
              className="btn btn-primary mt-6 w-full"
            >
              {busy === "checkout"
                ? "Redirecionando para o pagamento…"
                : "Finalizar compra"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Pagamento seguro via Stripe (modo de teste)
            </p>
            <Link
              href="/"
              className="mt-4 block text-center text-sm text-slate-500 transition-all duration-300 hover:text-indigo-600"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

function CartRow({
  item,
  disabled,
  loading,
  onChange,
  onRemove,
}: {
  item: CartItem;
  disabled: boolean;
  loading: boolean;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={`card flex gap-4 p-4 hover:shadow-md sm:gap-6 sm:p-6 ${
        loading ? "opacity-60" : ""
      }`}
    >
      <div
        aria-hidden
        className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white sm:h-24 sm:w-24"
      >
        {item.product.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/products/${item.product.id}`}
              className="block truncate font-semibold transition-all duration-300 hover:text-indigo-600"
            >
              {item.product.name}
            </Link>
            <p className="text-sm text-slate-500">
              {formatPrice(item.unitPriceInCents)} cada
            </p>
          </div>
          <p className="shrink-0 font-bold tracking-tight">
            {formatPrice(item.subtotal)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white"
            role="group"
            aria-label={`Quantidade de ${item.product.name}`}
          >
            <button
              onClick={() => onChange(item.quantity - 1)}
              disabled={disabled || item.quantity <= 1}
              aria-label="Diminuir quantidade"
              className="grid h-10 w-10 place-items-center rounded-l-xl text-lg text-slate-600 transition-all duration-300 hover:bg-slate-100 disabled:opacity-40"
            >
              −
            </button>
            <span
              className="min-w-10 text-center text-sm font-semibold"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              onClick={() => onChange(item.quantity + 1)}
              disabled={disabled || item.quantity >= MAX_QUANTITY}
              aria-label="Aumentar quantidade"
              className="grid h-10 w-10 place-items-center rounded-r-xl text-lg text-slate-600 transition-all duration-300 hover:bg-slate-100 disabled:opacity-40"
            >
              +
            </button>
          </div>

          <button
            onClick={onRemove}
            disabled={disabled}
            className="btn btn-ghost"
          >
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}

function CartSkeleton() {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Carregando seu carrinho… (se a API estava dormindo, a primeira vez pode
        demorar)
      </p>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <div className="skeleton h-36" />
          <div className="skeleton h-36" />
        </div>
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}