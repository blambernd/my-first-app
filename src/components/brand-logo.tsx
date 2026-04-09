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
      {/* Oldtimer silhouette — filled shape for visibility at small sizes */}
      <path
        d={`
          M7 21.5
          L7 19.5
          L7.5 19
          L8 18
          L11.5 18
          L13 14
          C13.2 13.5 13.5 13 14 13
          L19.5 13
          C20 13 20.3 13.5 20.5 14
          L22 18
          L25 18
          L25.5 19
          L26 19.5
          L26 21.5
          Z
        `}
        fill={fillColor}
        opacity="0.85"
      />
      {/* Windows (cut out from body) */}
      <path d="M13.8 17.5 L14.5 14.5 L16 14.5 L16 17.5 Z" fill={variant === "light" ? "hsl(220, 60%, 22%)" : "hsl(40, 30%, 96%)"} opacity="0.5" />
      <path d="M16.5 14.5 L19 14.5 L20 17.5 L16.5 17.5 Z" fill={variant === "light" ? "hsl(220, 60%, 22%)" : "hsl(40, 30%, 96%)"} opacity="0.5" />
      {/* Front wheel */}
      <circle cx="10.5" cy="21.5" r="2.3" fill={fillColor} />
      <circle cx="10.5" cy="21.5" r="1.2" fill={variant === "light" ? "hsl(220, 60%, 22%)" : "hsl(40, 30%, 96%)"} opacity="0.4" />
      <circle cx="10.5" cy="21.5" r="0.5" fill={fillColor} />
      {/* Rear wheel */}
      <circle cx="22.5" cy="21.5" r="2.3" fill={fillColor} />
      <circle cx="22.5" cy="21.5" r="1.2" fill={variant === "light" ? "hsl(220, 60%, 22%)" : "hsl(40, 30%, 96%)"} opacity="0.4" />
      <circle cx="22.5" cy="21.5" r="0.5" fill={fillColor} />
      {/* Running board */}
      <rect x="12.5" y="20.5" width="7.5" height="1.5" rx="0.5" fill={fillColor} opacity="0.7" />
      {/* Headlight */}
      <circle cx="7" cy="18.8" r="0.8" fill={fillColor} />
      {/* Front bumper */}
      <rect x="6" y="20" width="1.5" height="2" rx="0.5" fill={fillColor} opacity="0.6" />
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
