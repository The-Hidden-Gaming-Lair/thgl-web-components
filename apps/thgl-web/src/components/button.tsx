import { cn } from "@/lib/utils";
import { orbitron } from "@/styles/fonts";
import { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        orbitron.className,
        "border rounded border-brand/50 hover:border-brand w-fit py-1 px-2 bg-brand/10 hover:bg-brand/20  transition-all uppercase text-sm",
        className
      )}
    />
  );
}
