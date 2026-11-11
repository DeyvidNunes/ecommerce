import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ApiError } from "@/lib/api-error";
import { formatPrice } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { ProductImage } from "@/components/product-image";

type Params = Promise<{ id: string }>;

export default function ProductPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition-all duration-300 hover:text-indigo-600"
      >
        ← Voltar ao catálogo
      </Link>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();

  let product;
  try {
    product = await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  if (!product.active) notFound();

  const stockLabel =
    product.stock === 0
      ? { text: "Produto esgotado", dot: "bg-rose-500" }
      : product.stock <= 5
        ? { text: `Restam apenas ${product.stock}`, dot: "bg-amber-500" }
        : { text: `${product.stock} em estoque`, dot: "bg-emerald-500" };

  return (
    <div className="mt-8 grid items-start gap-8 md:grid-cols-2 lg:gap-12">
      <ProductImage
        src={product.imageUrl}
        name={product.name}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="card aspect-square"
        letterClassName="text-8xl"
      />

      <div className="flex flex-col gap-4">
        {product.category && (
          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {product.category}
          </span>
        )}
        <h1 className="text-3xl font-bold sm:text-4xl">{product.name}</h1>
        {product.description && (
          <p className="text-lg text-slate-600">{product.description}</p>
        )}
        <p className="text-4xl font-bold tracking-tight">
          {formatPrice(product.priceInCents)}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${stockLabel.dot}`}
          />
          {stockLabel.text}
        </p>
        <AddToCartButton productId={product.id} stock={product.stock} />
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2 lg:gap-12">
      <div className="skeleton aspect-square" />
      <div className="space-y-4">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-10 w-3/4" />
        <div className="skeleton h-6 w-full" />
        <div className="skeleton h-12 w-40" />
      </div>
    </div>
  );
}
