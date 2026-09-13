import { ComponentProps } from "react";
import { logoPaths, logoViewBox } from "#/lib/logo";

export function LogoMark(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={logoViewBox}
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {logoPaths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
