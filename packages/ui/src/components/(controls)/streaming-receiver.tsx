"use client";

import { cn, useGameState, useSettingsStore } from "@repo/lib";
import type { ActorPlayer, Actor } from "@repo/lib/overwolf";
import Peer, { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ExternalAnchor } from "../(header)";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Antenna } from "lucide-react";
import { useCoordinates } from "../(providers)";

export function StreamingReceiver({
  className,
  domain,
  href,
}: {
  className?: string;
  domain: string;
  href: string;
}) {
  const { setLiveMode, appId, setAppId } = useSettingsStore(
    useShallow((state) => ({
      setLiveMode: state.setLiveMode,
      appId: state.appId,
      setAppId: state.setAppId,
    })),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const peerRef = useRef<Peer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const game = useGameState(
    useShallow((state) => ({
      setPlayer: state.setPlayer,
      setActors: state.setActors,
    })),
  );
  const { isHydrated } = useCoordinates();

  useEffect(() => {
    setLiveMode(!!connection);
  }, [connection]);

  function closeConnectionToPeerServer() {
    setErrorMessage("");
    setIsLoading(false);
    closeExistingConnection();
    if (peerRef.current) {
      peerRef.current.destroy();
    }
  }
  function closeExistingConnection() {
    if (connection) {
      connection.close();
      setConnection(null);
    }
  }

  function initializeConnection(conn: DataConnection) {
    closeExistingConnection();

    conn.on("open", () => {
      setConnection(conn);
      console.log("conn open", conn.connectionId);
    });
    conn.on("data", (data) => {
      if (typeof data !== "object" || data === null) {
        return;
      }
      if ("player" in data) {
        game.setPlayer(data.player as ActorPlayer);
      }
      if ("actors" in data) {
        game.setActors(data.actors as Actor[]);
      }
    });
    conn.on("close", () => {
      setConnection(null);
      console.log("conn close", conn.connectionId);
    });
    conn.on("error", (error) => {
      console.log("conn error", error);
    });
  }

  function connectToPeer(onOpen?: () => void) {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    const fn = async () => {
      const PeerJs = (await import("peerjs")).default;
      peerRef.current = new PeerJs();
      peerRef.current.on("close", () => {
        console.log("peer close");
        setIsConnected(false);
        closeExistingConnection();
      });
      peerRef.current.on("error", (error) => {
        setErrorMessage(error.message);
        console.log("peer error", error, error.name, error.message);
      });
      peerRef.current.on("open", (id) => {
        console.log("peer open", id);
        setIsConnected(true);
        if (onOpen) {
          onOpen();
        }
      });
      peerRef.current.on("connection", (conn) => {
        console.log("peer connection", conn);
        initializeConnection(conn);
      });
      peerRef.current.on("disconnected", (connectionId) => {
        console.log("peer disconnected", connectionId);
        setIsConnected(false);
      });
    };
    fn();
  }

  function handleId(id: string) {
    if (!id) {
      setErrorMessage("Please enter an ID");
      return;
    }
    if (!peerRef.current || peerRef.current.disconnected) {
      setErrorMessage("Connect to peer server first");
      return;
    }
    if (id === peerRef.current.id) {
      setErrorMessage("You can not connect to yourself");
      return;
    }
    setErrorMessage("");
    const conn = peerRef.current.connect(`${domain}-th-gl-${id}`);
    initializeConnection(conn);
  }

  useEffect(() => {
    if (isHydrated && appId) {
      connectToPeer(() => {
        if (peerRef.current) {
          handleId(appId);
        }
      });
    }
  }, [isHydrated]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    connectToPeer(() => {
      if (peerRef.current) {
        handleId(appId);
      }
      setIsLoading(false);
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "lg:w-auto lg:h-9 lg:px-4 lg:py-2",
            className,
            connection
              ? "text-green-400"
              : isConnected
                ? "text-yellow-500"
                : "text-orange-500",
          )}
        >
          <Antenna className="lg:mr-2 h-4 w-4" />
          <span className="hidden lg:inline">Live Sync</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Live Sync</DialogTitle>
          <DialogDescription>
            Install the{" "}
            <ExternalAnchor
              className="text-primary group-hover:underline"
              href={href}
            >
              in-game app
            </ExternalAnchor>{" "}
            to sync your player position with this map on every device.
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-2 overflow-hidden">
          <p className="flex items-center gap-2">
            <span
              className={cn(
                "w-3 h-3 inline-block rounded-xl",
                connection
                  ? "bg-green-400"
                  : isConnected
                    ? "bg-yellow-500"
                    : "bg-orange-500",
              )}
            ></span>
            <span>
              {connection
                ? "Connected to app"
                : isConnected
                  ? "Connected to peer server"
                  : "Not connected to peer server"}
            </span>
          </p>
          <p className="uppercase text-orange-500 h-6 truncate ">
            {errorMessage}
          </p>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                type="text"
                value={appId}
                onChange={(event) => setAppId(event.target.value)}
                required
                placeholder="You can find the ID in the app"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!connection || !appId}
              className="w-full"
            >
              {isLoading && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect to app
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!isConnected}
              className="w-full"
              onClick={() => closeConnectionToPeerServer()}
            >
              Disconnect
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
