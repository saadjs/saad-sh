import { useEffect, useState, type ComponentType, type ReactNode } from "react";

// Interactive embeds for posts. A post writes
//
//   <post-demo name="agent-pipeline">
//   Fallback text for the feed, search and the .md copy.
//   </post-demo>
//
// on its own lines, and the page renders the matching component.
//
// Demos load in the browser after hydration, not during SSR: React.lazy
// suspends the Worker's stream until the chunk resolves, which hung the page.
// The server sends the fallback text, so the page still reads without JS, and
// each demo's code only downloads on posts that use it.
type Loader = () => Promise<{ default: ComponentType }>;

const demos: Record<string, Loader> = {
  "agent-pipeline": () => import("./demos/agent-workflow/PipelineDemo"),
  "agent-failures": () => import("./demos/agent-workflow/FailureDemo"),
  "agent-dial": () => import("./demos/agent-workflow/DialDemo"),
  "agent-patterns": () => import("./demos/agent-workflow/PatternsDemo"),
};

export const demoNames = Object.keys(demos);

export function PostDemo({ name, children }: { name?: string; children?: ReactNode }) {
  // Keyed by name so a reused instance (client navigation to another post)
  // never shows the previous post's demo while the next one loads.
  const [loaded, setLoaded] = useState<{ name: string; Demo: ComponentType } | null>(null);

  useEffect(() => {
    const load = name ? demos[name] : undefined;
    if (!name || !load) return;
    let cancelled = false;
    load().then(
      (module) => {
        if (!cancelled) setLoaded({ name, Demo: module.default });
      },
      () => {
        // A failed chunk leaves the fallback text in place.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (loaded && loaded.name === name) return <loaded.Demo />;
  return <div className="post-demo post-demo-fallback">{children}</div>;
}
