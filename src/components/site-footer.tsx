import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Oldtimer Garage. Alle Rechte vorbehalten.</p>
        <nav className="flex gap-4">
          <Link href="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
          <Link href="/haftung" className="hover:text-foreground transition-colors">
            Haftung
          </Link>
        </nav>
      </div>
    </footer>
  );
}
