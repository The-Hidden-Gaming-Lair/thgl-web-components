import type { DataConnection } from "peerjs";
import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { create } from "zustand";
import { cn, useGameState, useSettingsStore } from "@repo/lib";
import { useShallow } from "zustand/react/shallow";
import { Input } from "../ui/input";
import { QR } from "./qr";
import { Antenna } from "lucide-react";

const useConnectionStore = create<{
  connections: Record<string, DataConnection>;
  addConnection: (conn: DataConnection) => void;
  closeExistingConnection: (peer: string) => void;
  closeExistingConnections: () => void;
  initializeConnection: (conn: DataConnection) => void;
}>((set) => ({
  connections: {},
  addConnection: (conn) => {
    set((state) => ({
      connections: {
        ...state.connections,
        [conn.peer]: conn,
      },
    }));
  },
  closeExistingConnection: (peer) => {
    set((state) => {
      const next = { ...state.connections };
      delete next[peer];
      return { connections: next };
    });
  },
  closeExistingConnections: () => {
    set({ connections: {} });
  },
  initializeConnection: (conn) => {
    set((state) => {
      const next = { ...state.connections };
      next[conn.peer] = conn;
      return { connections: next };
    });
  },
}));

function createRandomWord(alphabet: string, length: number): string {
  let result = "";
  const alphabetLength = alphabet.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphabetLength);
    result += alphabet[randomIndex];
  }
  return result;
}

export function StreamingSender({
  hidden,
  domain,
}: {
  hidden: boolean;
  domain: string;
}) {
  const connectionStore = useConnectionStore();
  const [isConnected, setIsConnected] = useState(false);
  const { appId, setAppId } = useSettingsStore(
    useShallow((state) => ({
      appId: state.appId,
      setAppId: state.setAppId,
    })),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const peerRef = useRef<Peer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const game = useGameState(
    useShallow((state) => ({
      player: state.player,
      actors: state.actors,
    })),
  );

  useEffect(() => {
    if (!appId) {
      setAppId(createRandomWord("1234567890abcdef", 10));
    }
  }, []);

  function sendToConnections(data: any) {
    Object.values(connectionStore.connections).forEach((conn) => {
      conn.send(data);
    });
  }

  useEffect(() => {
    if (game.player) {
      sendToConnections({ player: game.player });
    }
  }, [game.player]);

  useEffect(() => {
    if (game.actors) {
      sendToConnections({ actors: game.actors });
    }
  }, [game.actors]);

  function closeConnectionToPeerServer() {
    setErrorMessage("");
    setIsLoading(false);
    connectionStore.closeExistingConnections();
    if (peerRef.current) {
      peerRef.current.destroy();
    }
  }

  function initializeConnection(conn: DataConnection) {
    connectionStore.closeExistingConnection(conn.peer);

    conn.on("open", () => {
      connectionStore.addConnection(conn);
      console.log("conn open", conn.connectionId);
    });
    conn.on("close", () => {
      connectionStore.closeExistingConnection(conn.peer);
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
    peerRef.current = new Peer(`${domain}-th-gl-${appId}`);
    peerRef.current.on("close", () => {
      console.log("peer close");
      setIsConnected(false);
      connectionStore.closeExistingConnections();
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
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    connectToPeer(() => {
      setIsLoading(false);
    });
  }

  if (hidden) {
    return <></>;
  }

  const hasConnections = Object.keys(connectionStore.connections).length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "lg:w-auto lg:h-9 lg:px-4 lg:py-2",
            hasConnections
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
            Stream the player position and spawned nodes by connecting to a
            browser on your favorite device (phone, tablet, PC). The connection
            is peer-to-peer and does not go through our servers. A server is
            only used to establish the connection.
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-2">
          <p className="flex items-center gap-2">
            <span
              className={cn("w-3 h-3 inline-block rounded-xl", {
                "bg-green-400": appId && hasConnections,
                "bg-yellow-500": appId && !hasConnections && isConnected,
                "bg-orange-500": appId && !hasConnections && !isConnected,
                "bg-red-500": !appId,
              })}
            ></span>
            <span>
              {appId &&
                hasConnections &&
                `Connected to ${
                  Object.keys(connectionStore.connections).length
                } browser`}
              {appId &&
                !hasConnections &&
                isConnected &&
                "Waiting for a browser to connect"}
              {appId &&
                !hasConnections &&
                !isConnected &&
                "Not connected to streaming server"}
              {!appId && "Can not detect character name"}
            </span>
          </p>
          <p className="uppercase text-orange-500 h-6 truncate">
            {errorMessage}
          </p>
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label
                htmlFor="appId"
                onClick={() => navigator.clipboard.writeText(appId)}
              >
                App ID (click to copy)
              </Label>
              <Input
                id="appId"
                type="text"
                value={appId}
                onClick={() => navigator.clipboard.writeText(appId)}
                onChange={(event) => setAppId(event.target.value)}
                required
                placeholder="This ID is used to identify this app"
                disabled={isConnected}
              />
              <QR
                value={
                  appId
                    ? `https://${domain}.th.gl?app_id=${appId}`
                    : `https://${domain}.th.gl`
                }
              />
              <a
                className="text-xs text-center truncate hover:text-primary transition-colors"
                href={
                  appId
                    ? `https://${domain}.th.gl?app_id=${appId}`
                    : `https://${domain}.th.gl`
                }
                target="_blank"
              >
                {appId
                  ? `https://${domain}.th.gl?app_id=${appId}`
                  : `https://${domain}.th.gl`}
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !appId || isConnected}
              className="w-full"
            >
              {isLoading && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect to streaming server
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
