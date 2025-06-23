"use client";

import { useEffect, useState } from "react";

export function Ping({ url }: { url: string }) {
  const [ping, setPing] = useState(100000);

  useEffect(() => {
    if (!url.startsWith("ws")) {
      return;
    }
    const fetchPing = () => {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        const pings: number[] = [];

        for (let i = 0; i < 5; i++) {
          ws.send(Date.now().toString());
        }
        ws.onmessage = (n) => {
          const startTime = parseInt(n.data, 10);
          if (Number.isNaN(startTime)) pings.push(100000);
          else {
            const time = Date.now() - startTime;
            pings.push(time);
            if (pings.length === 5) {
              ws.close();
              const minPing = Math.min(...pings);
              setPing(minPing);
            }
          }
        };
      };
      ws.onerror = () => {
        setPing(100000);
      };
    };
    fetchPing();
    const intervalId = setInterval(fetchPing, 10000);
    return () => clearInterval(intervalId);
  }, [url]);

  useEffect(() => {
    if (!url.startsWith("http")) {
      return;
    }
    const fetchPing = async () => {
      const start = Date.now();
      try {
        const response = await fetch(url);
        if (!response.ok) {
          setPing(100000);
        } else {
          setPing(Date.now() - start);
        }
      } catch (error) {
        setPing(100000);
      }
    };
    fetchPing().then(() => setTimeout(fetchPing, 1000));
    const intervalId = setInterval(fetchPing, 10000);
    return () => clearInterval(intervalId);
  }, [url]);

  return <span>{ping === 100000 ? "N/A" : `${ping}ms`}</span>;
}
