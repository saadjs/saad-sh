import { useRouteContext } from "@tanstack/react-router";
import { getStyle } from "#/styles";
import type { StyleDefinition } from "#/styles/types";

/** The style this page is rendered in. */
export function useStyle(): StyleDefinition {
  const context = useRouteContext({ from: "__root__" }) as { styleId?: string } | undefined;
  return getStyle(context?.styleId);
}
