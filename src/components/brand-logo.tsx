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
        opacity="0.1"
        stroke={fillColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Classic car silhouette */}
      <path
        d="M9 19h14M10.5 17l1.5-3h8l1.5 3M10 19a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM20 19a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"
        stroke={fillColor}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Horizontal accent line */}
      <line
        x1="12"
        y1="12"
        x2="20"
        y2="12"
        stroke={fillColor}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
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
