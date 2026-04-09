interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
}

const sizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function BrandLogo({
  className = "",
  size = "md",
  variant = "default",
}: BrandLogoProps) {
  const sizeClass = sizes[size];
  const fillColor =
    variant === "light" ? "hsl(40, 30%, 96%)" : "hsl(220, 60%, 22%)";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${className}`}
      aria-hidden="true"
    >
      {/* Shield shape */}
      <path
        d="M16 2L4 7v9c0 7.18 5.12 13.88 12 15.5C22.88 29.88 28 23.18 28 16V7L16 2z"
        fill={fillColor}
        opacity="0.12"
        stroke={fillColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Oldtimer — classic 1930s sedan silhouette */}
      {/* Main body: long hood, cabin, rounded trunk */}
      <path
        d="M6.5 21 L7 18.5 C7 18 7.3 17.5 8 17.5 L11 17.5 L12.5 14 C12.8 13.3 13.3 13 14 13 L19 13 C19.7 13 20.2 13.3 20.5 14 L21.5 17.5 L24 17.5 C24.7 17.5 25 18 25 18.5 L25.5 21"
        stroke={fillColor}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cabin windows */}
      <path
        d="M13.2 17.5 L14 14.5 L16 14.5 L16 17.5"
        stroke={fillColor}
        strokeWidth="0.9"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M16 14.5 L18.5 14.5 L19.8 17.5"
        stroke={fillColor}
        strokeWidth="0.9"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      {/* Front fender arch */}
      <path
        d="M7.5 21 C7.5 19.2 8.5 18.2 10 18.2 C11.5 18.2 12.5 19.2 12.5 21"
        stroke={fillColor}
        strokeWidth="1.3"
        fill="none"
      />
      {/* Rear fender arch */}
      <path
        d="M19.5 21 C19.5 19.2 20.5 18.2 22 18.2 C23.5 18.2 24.5 19.2 24.5 21"
        stroke={fillColor}
        strokeWidth="1.3"
        fill="none"
      />
      {/* Running board between fenders */}
      <line x1="12.5" y1="21" x2="19.5" y2="21" stroke={fillColor} strokeWidth="1.3" strokeLinecap="round" />
      {/* Front wheel */}
      <circle cx="10" cy="21" r="2" stroke={fillColor} strokeWidth="1.1" fill="none" />
      <circle cx="10" cy="21" r="0.7" fill={fillColor} />
      {/* Rear wheel */}
      <circle cx="22" cy="21" r="2" stroke={fillColor} strokeWidth="1.1" fill="none" />
      <circle cx="22" cy="21" r="0.7" fill={fillColor} />
      {/* Headlight */}
      <circle cx="7" cy="18" r="0.7" fill={fillColor} opacity="0.6" />
      {/* Radiator grille lines */}
      <line x1="7" y1="18.8" x2="7" y2="20.5" stroke={fillColor} strokeWidth="0.7" opacity="0.5" />
    </svg>
  );
}

export function BrandLogoWithText({
  variant = "default",
}: {
  variant?: "default" | "light";
}) {
  const textColor =
    variant === "light" ? "text-primary-foreground" : "text-foreground";

  return (
    <div className="flex items-center gap-2.5">
      <BrandLogo size="md" variant={variant} />
      <div className="flex flex-col leading-none">
        <span
          className={`text-base font-semibold tracking-tight ${textColor}`}
        >
          Oldtimer
        </span>
        <span
          className={`text-[10px] font-medium tracking-[0.2em] uppercase ${textColor} opacity-60`}
        >
          Docs
        </span>
      </div>
    </div>
  );
}
