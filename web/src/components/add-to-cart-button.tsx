"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/api-error";
import type { Cart } from "@/lib/types";

export function AddToCartButton({
  productId,
  stock,
}: {
  productId: number;
  stock: number;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  if (stock === 0) {
    return (
      <button
        disabled
        className="mt-2 rounded bg-black px-4 py-3 text-white opacity-50"
      >
        Esgotado
      </button>
    );
  }

  async function handleAdd() {
    setLoading(true);
    setMessage(null);
    try {
      await api<Cart>("/cart/items", {
        method: "POST",
        body: { productId, quantity },
      });
      setMessage({ ok: true, text: "Produto adicionado ao carrinho." });
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof ApiError ? error.message : "Erro inesperado",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        Quantidade
        <input
          type="number"
          min={1}
          max={stock}
          value={quantity}
          onChange={(e) =>
            setQuantity(
              Math.min(stock, Math.max(1, Number(e.target.value) || 1)),
            )
          }
          className="w-20 rounded border px-2 py-1"
        />
      </label>

      {isLoaded && !isSignedIn ? (
        <SignInButton mode="modal">
          <button className="rounded bg-black px-4 py-3 text-white">
            Entre para adicionar ao carrinho
          </button>
        </SignInButton>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading || !isLoaded}
          className="rounded bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Adicionando…" : "Adicionar ao carrinho"}
        </button>
      )}

      {message && (
        <p
          className={
            message.ok ? "text-sm text-green-700" : "text-sm text-red-600"
          }
        >
          {message.text}{" "}
          {message.ok && (
            <Link href="/cart" className="underline">
              Ver carrinho
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
