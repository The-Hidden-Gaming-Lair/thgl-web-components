"use client";
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/controls";
import { useT } from "@repo/ui/providers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export const modes: string[] = ["1v1", "coop"];

export default function ModeSelect({ mode }: { mode: string }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("mode")) {
      params.set("mode", mode);
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, []);

  return (
    <div className="flex gap-1 items-center">
      <Label>Mode:</Label>
      <Select
        value={mode}
        onValueChange={(value) => {
          router.push(`${pathname}?${createQueryString("mode", value)}`);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select your mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Modes</SelectLabel>
            {modes.map((newMode) => (
              <SelectItem key={newMode} value={newMode}>
                {t(newMode)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
