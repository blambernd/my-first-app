import * as React from "react"

/**
 * Ab dieser Breite gilt "Desktop" (PROJ-30).
 *
 * shadcn liefert 768 px. Die Fahrzeugnavigation soll laut Spec erst ab
 * 1024 px fest neben dem Inhalt stehen und darunter als Panel überlagern —
 * bei 768 px blieben sonst weniger als 550 px für den Inhalt.
 *
 * Diese Grenze wird derzeit ausschließlich von der Sidebar verwendet.
 */
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
