"use client";

import { useEffect, useState } from "react";

export function Ping({ url }: { url: string }) {
  const [ping, setPing] = useState(-1);

  useEffect(() => {
    const fetchPing = async () => {
      const start = Date.now();
      try {
        console.log(`Pinging ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          setPing(-1);
        } else {
          setPing(Date.now() - start);
        }
      } catch (error) {
        setPing(-1);
      }
    };
    fetchPing().then(() => setTimeout(fetchPing, 1000));
    const intervalId = setInterval(fetchPing, 10000);
    return () => clearInterval(intervalId);
  }, [url]);

  return <span>{ping === -1 ? "N/A" : `${ping}ms`}</span>;
}
