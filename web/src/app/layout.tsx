import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loja",
  description: "E-commerce de portfólio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className={`${inter.variable} font-sans antialiased`}>
          <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <Link
                href="/"
                className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-xl font-bold tracking-tight text-transparent transition-all duration-300 hover:scale-105"
              >
                Loja
              </Link>
              <nav className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/products"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-slate-900"
                >
                  Produtos
                </Link>
                <Link
                  href="/cart"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-slate-900"
                >
                  Carrinho
                </Link>
                <Link
                  href="/orders"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-white/70 hover:text-slate-900"
                >
                  Pedidos
                </Link>
                <Suspense fallback={null}>
                  <Show when="signed-out">
                    <SignInButton>
                      <button className="btn btn-secondary !px-4 !py-2">
                        Entrar
                      </button>
                    </SignInButton>
                    <SignUpButton>
                      <button className="btn btn-primary !px-4 !py-2">
                        Cadastrar
                      </button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <UserButton />
                  </Show>
                </Suspense>
              </nav>
            </div>
          </header>
          {children}
          <footer className="mt-24 border-t border-slate-200/70">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
              <span>Loja · projeto de portfólio</span>
              <span>Next.js · NestJS · Stripe · Clerk</span>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
