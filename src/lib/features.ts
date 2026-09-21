import { createServerFn } from "@tanstack/react-start";
import { newsletterEnabled } from "./features.server";

export const getFeatures = createServerFn({ method: "GET" }).handler(() => ({
  newsletter: newsletterEnabled(),
}));
