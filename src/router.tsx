import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    // Pages cross-fade and a post's title travels from its list row to the
    // post page. Jumping to a heading on the same page is not a page change,
    // so it does not fade (the router only asks in browsers with transition
    // types). Browsers without view transitions navigate as before.
    defaultViewTransition: { types: ({ pathChanged }) => (pathChanged ? ["page"] : false) },
    trailingSlash: "never",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
