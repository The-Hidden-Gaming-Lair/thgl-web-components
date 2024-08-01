import { MyFilter, useSettingsStore } from "@repo/lib";
import { useEffect } from "react";
import useSWR from "swr";

export function SharedFilter({ myFilter }: { myFilter: MyFilter }) {
  const setMyFilter = useSettingsStore((state) => state.setMyFilter);

  const { data } = useSWR(myFilter.url, async () => {
    if (!myFilter.url) {
      return;
    }
    const response = await fetch(myFilter.url);
    if (!response.ok) {
      throw new Error("Can not fetch shared nodes");
    }
    return response.json() as Promise<MyFilter>;
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    const withoutName: Partial<MyFilter> = { ...data };
    delete withoutName.name;
    setMyFilter(myFilter.name, withoutName);
  }, [data]);

  return <></>;
}
