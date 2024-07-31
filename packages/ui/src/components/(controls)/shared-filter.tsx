import { useSettingsStore } from "@repo/lib";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

export function SharedFilter({ url, filter }: { url: string; filter: string }) {
  const privateNodes = useSettingsStore((state) => state.privateNodes);
  const setPrivateNodes = useSettingsStore((state) => state.setPrivateNodes);

  const newPrivateNodes = useMemo(
    () => privateNodes.filter((node: any) => node.filter !== filter),
    [privateNodes],
  );

  const { data } = useSWR(url, async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Can not fetch shared nodes");
    }
    return response.json();
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    data.forEach((node: any) => {
      newPrivateNodes.push(node);
    });
    console.log(data, newPrivateNodes);
    setPrivateNodes(newPrivateNodes);
  }, [data]);

  return <></>;
}
