import type { ReactNode } from "react";

interface PageHeadProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}

/** The heading block every ordinary page opens with. */
export function PageHead({ title, eyebrow, intro, children }: PageHeadProps) {
  return (
    <header className="page-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {intro && <p className="page-intro">{intro}</p>}
      {children}
    </header>
  );
}
