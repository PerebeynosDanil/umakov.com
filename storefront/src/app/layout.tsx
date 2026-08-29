import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/providers/providers";
import { ChatWidget } from "@/components/chat-widget";
import { categoryImages, getCategoryTree, toMenu } from "@/lib/categories";
import { directCategoryImages, getCatalogIndex } from "@/lib/catalog-index";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "UMAKOV Germany — заборы, ворота, перила и навесы",
    template: "%s — UMAKOV Germany",
  },
  description:
    "Соберите свою систему онлайн: заборы, ворота, перила, перегородки и навесы. Установите самостоятельно или закажите монтаж у нас.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tree = await getCategoryTree();
  let images: Record<string, string> = {};
  try {
    images = categoryImages(tree.roots, directCategoryImages(await getCatalogIndex()));
  } catch {
    // без картинок меню тоже живёт
  }
  const menuCategories = toMenu(tree.roots, images);

  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header categories={menuCategories} />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
