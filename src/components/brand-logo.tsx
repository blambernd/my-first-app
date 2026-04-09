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
      {/* Oldtimer car body */}
      <path
        d="M8 20h16M9 20v-2.5h14V20"
        stroke={fillColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Oldtimer roof/cabin */}
      <path
        d="M12.5 17.5l1-2.5h5l1 2.5"
        stroke={fillColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Hood (long front) */}
      <path
        d="M9 17.5h3.5M19.5 17.5H23"
        stroke={fillColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Front fender curve */}
      <path
        d="M23 17.5c0.8 0 1 0.8 1 1.5"
        stroke={fillColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rear fender curve */}
      <path
        d="M9 17.5c-0.8 0-1 0.8-1 1.5"
        stroke={fillColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Wheels */}
      <circle cx="11" cy="20" r="1.4" stroke={fillColor} strokeWidth="1.1" fill="none" />
      <circle cx="11" cy="20" r="0.5" fill={fillColor} />
      <circle cx="21" cy="20" r="1.4" stroke={fillColor} strokeWidth="1.1" fill="none" />
      <circle cx="21" cy="20" r="0.5" fill={fillColor} />
      {/* Headlight */}
      <circle cx="23.5" cy="18.2" r="0.6" fill={fillColor} opacity="0.7" />
      {/* Running board */}
      <line x1="12.5" y1="19.8" x2="19.5" y2="19.8" stroke={fillColor} strokeWidth="0.5" opacity="0.4" />
      {/* Shield top accent */}
      <path
        d="M13 11l3-2 3 2"
        stroke={fillColor}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
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
