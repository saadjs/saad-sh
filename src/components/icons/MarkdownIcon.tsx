import { ComponentProps } from "react";

export function MarkdownIcon(props: ComponentProps<"svg">) {
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
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M6 15V9l2.5 3L11 9v6" />
      <path d="M17 9v5m0 0 2-2m-2 2-2-2" />
    </svg>
  );
}
