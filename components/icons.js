// Outline icons (24px, stroke = currentColor) that Heroicons doesn't provide,
// drawn in the same thin style as the mock's menu icons.

function Outline({ className = "h-6 w-6", children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function CreditsIcon(props) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.2 9.1a4 4 0 1 0 0 5.8M12 6.5v11" />
    </Outline>
  );
}

export function CrownIcon(props) {
  return (
    <Outline {...props}>
      <path d="M3 8.5l4.5 4L12 5.5l4.5 7 4.5-4-1.8 9.5H4.8L3 8.5z" />
      <path d="M5 21h14" />
    </Outline>
  );
}

export function ShirtIcon(props) {
  return (
    <Outline {...props}>
      <path d="M8.5 3.5 3 6.5l2 4.2 2.2-1V21h9.6V9.7l2.2 1 2-4.2-5.5-3c-.6 1.6-2 2.6-3.5 2.6s-2.9-1-3.5-2.6z" />
    </Outline>
  );
}

export function CapIcon(props) {
  return (
    <Outline {...props}>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M2.5 15h13.2c2.3 0 4.3.8 5.8 2.2-1.3.5-2.8.8-4.3.8H4.2c-1 0-1.7-1-1.7-1.9V15z" />
      <path d="M12 7V5.5M9 7.6l1.2 6.9" />
    </Outline>
  );
}

export function DiscIcon(props) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
    </Outline>
  );
}

export function VinylIcon(props) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 5.8a6.2 6.2 0 0 1 6.2 6.2M5.8 12A6.2 6.2 0 0 0 12 18.2M12 8.2a3.8 3.8 0 0 1 3.8 3.8" />
    </Outline>
  );
}

export function GemIcon(props) {
  return (
    <Outline {...props}>
      <path d="M6.5 4h11l3.5 5-9 11L3 9l3.5-5z" />
      <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
    </Outline>
  );
}

export function CassetteIcon(props) {
  return (
    <Outline {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="1.5" />
      <circle cx="8.5" cy="11" r="1.6" />
      <circle cx="15.5" cy="11" r="1.6" />
      <path d="M10 11h4M6.5 18.5l1.5-3h8l1.5 3" />
    </Outline>
  );
}
