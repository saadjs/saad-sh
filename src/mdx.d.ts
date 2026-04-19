declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { MDXProps } from "mdx/types";

  const component: ComponentType<MDXProps>;
  export default component;
  export const metadata: Record<string, unknown>;
}
