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

  const contrastColor =
    variant === "light" ? "hsl(220, 60%, 22%)" : "hsl(40, 30%, 96%)";

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
      {/* Wheels (drawn first, body covers their tops via fenders) */}
      <circle cx="10.5" cy="23" r="2.2" fill={fillColor} />
      <circle cx="10.5" cy="23" r="1.3" fill={contrastColor} opacity="0.5" />
      <circle cx="10.5" cy="23" r="0.5" fill={fillColor} />
      <circle cx="23" cy="23" r="2.2" fill={fillColor} />
      <circle cx="23" cy="23" r="1.3" fill={contrastColor} opacity="0.5" />
      <circle cx="23" cy="23" r="0.5" fill={fillColor} />
      {/* Car body — classic 1930s sedan with flowing fenders */}
      <path
        d="M6 19 L6 16 C6 14.5 7.5 13.5 9 13.5 L12 13 L13.5 9.5 C13.8 9 15 8.5 16 8.5 L18.5 8.5 C20 9 21 11 21.5 12.5 L23.5 13 C25 13.5 26 14.5 26 16.5 L26 19 C26 21 25 23 23 23 C21 23 20.5 21 20.5 19 L13 19 C13 21 12 23 10.5 23 C8.5 23 7 21 7 19 Z"
        fill={fillColor}
      />
      {/* Windows */}
      <path
        d="M14 12.5 L15 9.5 L16 9 L16 12.5 Z"
        fill={contrastColor}
        opacity="0.45"
      />
      <path
        d="M16.5 9 L18.5 9 L20 12 L16.5 12.5 Z"
        fill={contrastColor}
        opacity="0.45"
      />
      {/* Headlight */}
      <circle cx="6.5" cy="15" r="0.7" fill={contrastColor} opacity="0.4" />
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
