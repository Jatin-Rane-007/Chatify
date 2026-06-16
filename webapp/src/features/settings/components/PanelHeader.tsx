'use client';

interface PanelHeaderProps {
  readonly title: string;
  readonly onBack: () => void;
}

/** Shared back-arrow header for Settings sub-panels. */
export function PanelHeader({ title, onBack }: PanelHeaderProps) {
  return (
    <header className="px-5 py-4 border-b border-border flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={onBack}
        className="text-2xl leading-none text-muted-foreground hover:text-foreground"
        aria-label="Back"
      >
        ‹
      </button>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </header>
  );
}
