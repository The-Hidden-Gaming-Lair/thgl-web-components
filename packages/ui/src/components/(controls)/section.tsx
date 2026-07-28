import { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5 rounded-md bg-muted/20 p-3">
      <div>
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        {description && (
          <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
