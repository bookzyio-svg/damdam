import Header from "@/components/storefront/Header";
import CategoryNav from "@/components/storefront/CategoryNav";
import ReassuranceBar from "@/components/storefront/ReassuranceBar";
import Footer from "@/components/storefront/Footer";
import ChatWidget from "@/components/storefront/ChatWidget";
import CookieBanner from "@/components/storefront/CookieBanner";
import { CartProvider } from "@/components/cart/CartProvider";

/** Shell du storefront : header sticky + nav catégories + réassurance + footer. */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-bg">
        {/* Bande fine en haut (engagements qui défilent) */}
        <ReassuranceBar />
        {/* Header bleu (sticky) + barre catégories */}
        <Header />
        <CategoryNav />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        <CookieBanner />
      </div>
    </CartProvider>
  );
}
