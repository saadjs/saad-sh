import { ComponentProps } from "react";

export function WrapIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 7h14a4 4 0 1 1 0 8h-5" />
      <path d="m12 12-3 3 3 3" />
      <path d="M3 17h4" />
    </svg>
  );
}
