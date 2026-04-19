import { lazy, Suspense } from "react";

const SearchCommand = lazy(() =>
  import("#/components/SearchCommand").then((mod) => ({ default: mod.SearchCommand })),
);

export function SearchCommandClient() {
  return (
    <Suspense fallback={null}>
      <SearchCommand />
    </Suspense>
  );
}
