import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Oldtimer Docs. Alle Rechte vorbehalten.</p>
        <nav className="flex gap-4">
          <Link href="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:text-foreground transition-colors">
            AGB
          </Link>
          <Link href="/haftung" className="hover:text-foreground transition-colors">
            Haftung
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/kontakt" className="hover:text-foreground transition-colors">
            Kontakt
          </Link>
        </nav>
      </div>
    </footer>
  );
}
