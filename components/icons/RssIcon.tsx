import { ComponentProps } from "react";

export function RssIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 3a1 1 0 0 0 0 2 14 14 0 0 1 14 14 1 1 0 1 0 2 0A16 16 0 0 0 5 3Zm0 6a1 1 0 0 0 0 2 8 8 0 0 1 8 8 1 1 0 1 0 2 0A10 10 0 0 0 5 9Zm1.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}
