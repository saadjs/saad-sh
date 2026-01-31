"use client";

import dynamic from "next/dynamic";

const SearchCommand = dynamic(
  () => import("@/components/SearchCommand").then((mod) => mod.SearchCommand),
  { ssr: false },
);

export function SearchCommandClient() {
  return <SearchCommand />;
}
