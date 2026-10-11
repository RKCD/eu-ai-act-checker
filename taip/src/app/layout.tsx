import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser, localeOf } from "@/lib/session";
import { t } from "@/i18n/messages";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Taip!",
  description: "Kriisiaja abi- ja valmisolekuplatvorm",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#c8102e" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const locale = await localeOf(user);
  const m = t(locale);
  const links: [string, string][] =
    user?.role === "user"
      ? [["/abi", m.needHelp], ["/varud", m.myStock], ["/varjumine", m.shelters], ["/rahakott", m.wallet], ["/upgrade", m.upgrade]]
      : user?.role === "kov" ? [["/kov", "Vajaduste kaart"]]
      : user?.role === "redcross" ? [["/punane-rist", "Päringute järjekord"], ["/kov", "Vajaduste kaart"]]
      : user?.role === "partner" ? [["/partner", "Partneri vaade"]]
      : user?.role === "admin" ? [["/admin", "Kriis ja fond"], ["/kov", "Vajaduste kaart"]]
      : [];
  return (
    <html lang={locale}>
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="logo">Taip!</Link>
            <nav className="nav" aria-label="Peamenüü">
              {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
            </nav>
            <div className="who">
              {user ? (
                <form action={logout} className="row">
                  <span>{user.name}</span>
                  <button className="btn secondary small" type="submit">Vaheta kasutajat</button>
                </form>
              ) : <Link href="/login">Logi sisse</Link>}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
