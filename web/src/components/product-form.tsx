"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/api-error";
import { centsToInput, parsePriceToCents } from "@/lib/format";
import { compressImage, ImageError } from "@/lib/image-compress";
import type { Product } from "@/lib/types";

const MAX_STOCK = 1_000_000;

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const api = useApi();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product ? centsToInput(product.priceInCents) : "",
  );
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [category, setCategory] = useState(product?.category ?? "");
  const [active, setActive] = useState(product?.active ?? true);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Libera a memória da prévia quando ela muda ou o formulário fecha
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const priceInCents = parsePriceToCents(price);
  const stockNumber = Number(stock);

  const errors = {
    name: !name.trim()
      ? "Informe o nome"
      : name.length > 150
        ? "Máximo de 150 caracteres"
        : null,
    price:
      priceInCents === null
        ? "Informe um preço válido, por exemplo 49,90"
        : null,
    stock:
      stock.trim() === "" ||
      !Number.isInteger(stockNumber) ||
      stockNumber < 0 ||
      stockNumber > MAX_STOCK
        ? `Informe um número inteiro de 0 a ${MAX_STOCK}`
        : null,
    category: category.length > 80 ? "Máximo de 80 caracteres" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;

    setImageError(null);
    setProcessing(true);
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (e) {
      setImageError(
        e instanceof ImageError
          ? e.message
          : "Não foi possível processar a imagem",
      );
    } finally {
      setProcessing(false);
    }
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
    setImageError(null);
  }

  async function uploadImage(id: number, file: File) {
    const body = new FormData();
    body.append("file", file);
    await api<Product>(`/products/${id}/image`, { method: "POST", body });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (hasErrors || priceInCents === null) return;

    setSaving(true);
    let id = product?.id ?? createdId;
    let step: "dados" | "imagem" = "dados";

    try {
      if (product) {
        await api(`/products/${product.id}`, {
          method: "PATCH",
          body: {
            name: name.trim(),
            description: description.trim(),
            priceInCents,
            stock: stockNumber,
            category: category.trim(),
            active,
          },
        });
      } else if (createdId === null) {
        const created = await api<Product>("/products", {
          method: "POST",
          body: {
            name: name.trim(),
            ...(description.trim() && { description: description.trim() }),
            priceInCents,
            stock: stockNumber,
            ...(category.trim() && { category: category.trim() }),
          },
        });
        id = created.id;
        setCreatedId(created.id);
      }

      if (image && id !== null) {
        step = "imagem";
        await uploadImage(id, image);
      }

      router.push("/admin"); // mantém o botão travado até a navegação
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Erro inesperado";
      setFormError(
        step === "imagem"
          ? `${product ? "Dados salvos" : "Produto criado"}, mas a imagem não foi enviada: ${message}`
          : message,
      );
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="card space-y-6 p-6 sm:p-8"
    >
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <p>{formError}</p>
          {createdId !== null && (
            <p className="mt-2">
              Você pode tentar de novo ou{" "}
              <Link
                href={`/admin/products/${createdId}`}
                className="font-semibold underline"
              >
                abrir o produto para editar
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <Field
        label="Nome"
        htmlFor="name"
        error={submitted ? errors.name : null}
        hint={`${name.length}/150`}
      >
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          aria-invalid={submitted && Boolean(errors.name)}
        />
      </Field>

      <Field label="Descrição (opcional)" htmlFor="description">
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="input min-h-28 resize-y"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Preço (R$)"
          htmlFor="price"
          error={submitted ? errors.price : null}
        >
          <input
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="49,90"
            className="input"
            aria-invalid={submitted && Boolean(errors.price)}
          />
        </Field>

        <Field
          label="Estoque"
          htmlFor="stock"
          error={submitted ? errors.stock : null}
        >
          <input
            id="stock"
            type="number"
            min={0}
            step={1}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="input"
            aria-invalid={submitted && Boolean(errors.stock)}
          />
        </Field>
      </div>

      <Field
        label="Categoria (opcional)"
        htmlFor="category"
        error={submitted ? errors.category : null}
        hint={`${category.length}/80`}
      >
        <input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
          aria-invalid={submitted && Boolean(errors.category)}
        />
      </Field>

      <div className="space-y-2">
        <span className="text-sm font-medium">Imagem (opcional)</span>
        <div className="flex flex-wrap items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Prévia da nova imagem"
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <ProductImage
              src={product?.imageUrl ?? null}
              name={name.trim() || "Produto"}
              alt=""
              sizes="96px"
              className="h-24 w-24 shrink-0 rounded-2xl"
              letterClassName="text-3xl"
            />
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-secondary cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-500">
                {processing
                  ? "Processando…"
                  : image
                    ? "Trocar imagem"
                    : "Escolher imagem"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  disabled={processing || saving}
                  className="sr-only"
                />
              </label>
              {image && (
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={saving}
                  className="btn btn-ghost"
                >
                  Remover seleção
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {image
                ? `Imagem pronta (${Math.max(1, Math.round(image.size / 1024))} KB). ${
                    product?.imageUrl
                      ? "A imagem atual será substituída ao salvar."
                      : ""
                  }`
                : "JPEG, PNG ou WebP. A imagem é reduzida automaticamente."}
            </p>
          </div>
        </div>
        {imageError && (
          <p role="alert" className="text-sm text-rose-600">
            {imageError}
          </p>
        )}
      </div>

      {product && (
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 rounded accent-indigo-500"
          />
          Produto ativo (visível no catálogo)
        </label>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
        <Link href="/admin" className="btn btn-secondary">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving || processing}
          className="btn btn-primary"
        >
          {saving
            ? "Salvando…"
            : createdId !== null
              ? "Tentar enviar a imagem de novo"
              : product
                ? "Salvar alterações"
                : "Criar produto"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
