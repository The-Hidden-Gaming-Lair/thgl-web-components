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
import { create } from "zustand";
import { cn, useGameState, useSettingsStore } from "@repo/lib";
import { useShallow } from "zustand/react/shallow";
import { Input } from "../ui/input";
import { QR } from "./qr";
import { Cast, Copy, QrCode, Shuffle, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ScrollArea,
} from "../(controls)";
import { RemotePlayer, usePeersStore } from "../(providers)/peers-store";
import {
  PeerMeshUtils,
  peerServerOptions,
  type ControlMsg,
} from "../(providers)/peer-mesh-utils";

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

export function StreamingSender({
  hidden,
  domain,
  withoutLiveMode,
}: {
  hidden: boolean;
  domain: string;
  withoutLiveMode?: boolean;
}) {
  const connectionStore = useConnectionStore();
  const [isConnected, setIsConnected] = useState(false);
  const {
    peerCode,
    setPeerCode,
    playerName,
    setPlayerName,
    playerColor,
    setPlayerColor,
    autoJoinPeer,
    setAutoJoinPeer,
    _hasHydrated,
  } = useSettingsStore(
    useShallow((state) => ({
      peerCode: state.peerCode,
      setPeerCode: state.setPeerCode,
      playerName: state.playerName,
      setPlayerName: state.setPlayerName,
      playerColor: state.playerColor,
      setPlayerColor: state.setPlayerColor,
      autoJoinPeer: state.autoJoinPeer,
      setAutoJoinPeer: state.setAutoJoinPeer,
      _hasHydrated: state._hasHydrated,
    })),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const peerRef = useRef<Peer | null>(null);
  const controlPeerRef = useRef<Peer | null>(null);
  const player = useGameState((state) => state.player);
  const actors = useGameState((state) => state.actors);
  const [inPeer, setInPeer] = useState(false);
  const [joiningPeer, setJoiningPeer] = useState(false);
  const [peerSenderIds, setPeerSenderIds] = useState<string[]>([]);
  const [peerSenderNames, setPeerSenderNames] = useState<
    Record<string, string>
  >({});
  const [receiverCount, setReceiverCount] = useState<number>(0);
  const [receiversNeedingActors, setReceiversNeedingActors] =
    useState<number>(0);
  const [isLeader, setIsLeader] = useState<boolean>(false);

  // Peer store for displaying other senders
  const peersStoreSetPlayer = usePeersStore((s) => s.setRemotePlayer);
  const peersStoreRemove = usePeersStore((s) => s.removePeer);
  const peersStoreClear = usePeersStore((s) => s.clear);

  // Store for data connections to other senders
  const senderDataConnectionsRef = useRef<Record<string, DataConnection>>({});
  // Track sender-to-sender data connection status
  const [senderDataConnStatus, setSenderDataConnStatus] = useState<
    Record<string, "connecting" | "open" | "receiving" | "failed">
  >({});

  // Track which connections need actors (have selected this sender as "Me")
  const connectionsNeedingActorsRef = useRef<Set<string>>(new Set());
  const manualDisconnectRef = useRef(false);
  const joinPhaseRef = useRef("");

  // Auto-join peer mesh on load if we have a saved peer code and auto-join is enabled
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!peerCode) return;
    if (!autoJoinPeer) return;
    if (joiningPeer || inPeer) return;
    if (manualDisconnectRef.current) return; // Don't auto-rejoin after manual disconnect
    // Join the peer mesh automatically
    joinPeerMesh();
  }, [_hasHydrated]);

  function sendToConnections(data: any) {
    try {
      const sanitized = JSON.parse(JSON.stringify(data));

      // Send to receiver connections
      Object.values(connectionStore.connections).forEach((conn) => {
        // If this is actor data and the connection doesn't need actors, skip it
        if (
          data.actors &&
          !connectionsNeedingActorsRef.current.has(conn.peer)
        ) {
          return;
        }
        conn.send(sanitized);
      });

      // Also send player data to other senders (but not actors)
      if (data.player) {
        Object.values(senderDataConnectionsRef.current).forEach((conn) => {
          if (conn.open) {
            conn.send({ player: sanitized.player });
          }
        });
      }
    } catch (e) {
      console.error("Error sending data to connections", e);
    }
  }

  useEffect(() => {
    if (player && peerRef.current && playerName) {
      // Include player name, color and ID like the simulator
      const enhancedPlayer = {
        ...player,
        id: peerRef.current.id,
        name: playerName,
        color: playerColor,
      };
      sendToConnections({ player: enhancedPlayer });
    }
  }, [player, playerName, playerColor]);

  useEffect(() => {
    if (actors) {
      sendToConnections({ actors: actors });
    }
  }, [actors]);

  function initializeConnection(conn: DataConnection) {
    connectionStore.closeExistingConnection(conn.peer);

    conn.on("open", () => {
      connectionStore.addConnection(conn);
      console.log("conn open", conn.connectionId);
    });
    conn.on("data", (data) => {
      // Handle set-me/unset-me messages from receivers
      if (data && typeof data === "object" && "type" in data) {
        if (data.type === "set-me") {
          // This receiver selected us as "Me"
          connectionsNeedingActorsRef.current.add(conn.peer);
          setReceiversNeedingActors(connectionsNeedingActorsRef.current.size);
        } else if (data.type === "unset-me") {
          // This receiver unselected us as "Me"
          connectionsNeedingActorsRef.current.delete(conn.peer);
          setReceiversNeedingActors(connectionsNeedingActorsRef.current.size);
        }
      }
    });
    conn.on("close", () => {
      connectionStore.closeExistingConnection(conn.peer);
      // Also remove from actors tracking
      connectionsNeedingActorsRef.current.delete(conn.peer);
      setReceiversNeedingActors(connectionsNeedingActorsRef.current.size);
      console.log("conn close", conn.connectionId);
    });
    conn.on("error", (error) => {
      console.log("conn error", error);
    });
  }

  function initializeSenderDataConnection(
    conn: DataConnection,
    senderId: string,
    isIncoming: boolean = false,
  ) {
    // Guard: if we already have an open connection to this sender, skip
    const existing = senderDataConnectionsRef.current[senderId];
    if (existing && existing.open) {
      console.log(
        `Already have open connection to ${senderId}, skipping ${isIncoming ? "incoming" : "outbound"}`,
      );
      try {
        conn.close();
      } catch {}
      return;
    }
    setSenderDataConnStatus((prev) => ({ ...prev, [senderId]: "connecting" }));
    // Timeout: if connection doesn't open in 10s, mark as failed
    const connectionTimeout = setTimeout(() => {
      if (!conn.open) {
        console.log("Sender data connection timeout for", senderId);
        conn.removeAllListeners();
        try {
          conn.close();
        } catch {}
        delete senderDataConnectionsRef.current[senderId];
        setSenderDataConnStatus((prev) => ({ ...prev, [senderId]: "failed" }));
      }
    }, 10000);
    conn.on("data", (data) => {
      if (typeof data !== "object" || data === null) {
        return;
      }
      // Process data from other senders - only player positions, not actors
      if ("player" in data && data.player) {
        const remotePlayer = data.player as RemotePlayer;
        // Names are treated as unique per mesh (see evictStaleSenderByName), so
        // a sender with our own name is another session of ourselves — storing
        // it would render a labeled teammate marker on top of the local player.
        const ownName = useSettingsStore.getState().playerName;
        if (!ownName || remotePlayer.name !== ownName) {
          peersStoreSetPlayer(senderId, remotePlayer);
        } else if (usePeersStore.getState().remotePlayers[senderId]) {
          peersStoreRemove(senderId);
        }
        setSenderDataConnStatus((prev) => ({
          ...prev,
          [senderId]: "receiving",
        }));
      }
      // Note: actors are not processed from other senders
    });
    conn.on("open", () => {
      clearTimeout(connectionTimeout);
      setSenderDataConnStatus((prev) => ({ ...prev, [senderId]: "open" }));
      // When the data connection opens, proactively send our current player state
      if (player && peerRef.current && playerName) {
        const enhancedPlayer = {
          ...player,
          id: peerRef.current.id,
          name: playerName,
        };
        try {
          conn.send({ player: enhancedPlayer });
        } catch (e) {
          console.warn("Failed sending initial player state to sender", e);
        }
      }
    });
    conn.on("close", () => {
      clearTimeout(connectionTimeout);
      delete senderDataConnectionsRef.current[senderId];
      peersStoreRemove(senderId);
      setSenderDataConnStatus((prev) => {
        const next = { ...prev };
        delete next[senderId];
        return next;
      });
    });
    conn.on("error", () => {
      clearTimeout(connectionTimeout);
      delete senderDataConnectionsRef.current[senderId];
      peersStoreRemove(senderId);
      setSenderDataConnStatus((prev) => ({ ...prev, [senderId]: "failed" }));
    });
    senderDataConnectionsRef.current[senderId] = conn;
  }

  function connectToSenderDataPeer(senderId: string) {
    if (!peerRef.current || senderDataConnectionsRef.current[senderId]) {
      return; // Already connected or no data peer available
    }
    try {
      // Include our sender ID as metadata so the other sender knows this is a sender connection
      const conn = peerRef.current.connect(senderId, {
        label: peerRef.current.id,
        metadata: { senderId: peerRef.current.id, role: "sender" },
      });
      initializeSenderDataConnection(conn, senderId, false);
    } catch (error) {
      console.error("Failed to connect to sender data peer", senderId, error);
    }
  }

  function ensureDataPeer(onReady?: () => void) {
    if (peerRef.current && !peerRef.current.disconnected) {
      onReady?.();
      return;
    }
    const p = new Peer(peerServerOptions);
    peerRef.current = p;
    p.on("close", () => {
      setIsConnected(false);
      connectionStore.closeExistingConnections();
    });
    p.on("error", (error: any) => {
      // peer-unavailable just means a stale peer ID we tried to connect to is gone — not a real error
      if (error?.type === "peer-unavailable") {
        console.log("Data peer: stale peer unavailable", error?.message);
        return;
      }
      setErrorMessage(
        `Data peer error [${error?.type || "unknown"}]: ${error?.message || "Unknown error"}`,
      );
    });
    p.on("open", () => {
      setIsConnected(true);
      onReady?.();
    });
    p.on("connection", (conn) => {
      // Don't accept new connections if we manually disconnected
      if (manualDisconnectRef.current) {
        conn.close();
        return;
      }

      // Check if this is a sender-to-sender connection by looking at metadata
      const isSenderConnection =
        conn.metadata?.role === "sender" && conn.metadata?.senderId;

      if (isSenderConnection) {
        // This is another sender connecting to us
        const senderId = conn.metadata.senderId;
        initializeSenderDataConnection(conn, senderId, true);
      } else {
        // This is a receiver connection
        initializeConnection(conn);
      }
    });
    p.on("disconnected", () => {
      setIsConnected(false);
      if (!manualDisconnectRef.current) {
        // Try to reconnect to PeerServer
        try {
          p.reconnect();
        } catch (e) {
          console.log("Failed to reconnect data peer:", e);
        }
      }
    });
  }

  // ---- Peer Mesh control peer (sender registers as sender) ----

  function leavePeerMesh() {
    // Set manual disconnect flag to prevent auto-rejoin
    manualDisconnectRef.current = true;
    // Disable auto-join FIRST to prevent immediate reconnection
    setAutoJoinPeer(false);

    if (controlPeerRef.current) {
      try {
        controlPeerRef.current.destroy();
      } catch {}
      controlPeerRef.current = null;
    }

    // Also destroy the data peer to prevent any incoming connections
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {}
      peerRef.current = null;
    }

    // Clean up all receiver connections
    Object.values(connectionStore.connections).forEach((conn) => {
      conn.removeAllListeners();
      conn.close();
    });
    connectionStore.closeExistingConnections();

    // Clean up all sender data connections
    PeerMeshUtils.cleanupConnections(senderDataConnectionsRef.current);
    senderDataConnectionsRef.current = {};
    // Clear actors tracking
    connectionsNeedingActorsRef.current.clear();
    peersStoreClear();

    setInPeer(false);
    setJoiningPeer(false);
    setIsLeader(false);
    setPeerSenderIds([]);
    setPeerSenderNames({});
    setReceiverCount(0);
    setSenderDataConnStatus({});
    setReceiversNeedingActors(0);
    // Clear any errors when leaving
    setErrorMessage("");
  }

  function joinPeerMesh() {
    if (!peerCode) {
      setErrorMessage("Please enter a Peer Code");
      return;
    }
    // Clear manual disconnect flag when manually joining
    manualDisconnectRef.current = false;
    // Clean up any existing connections before joining
    if (controlPeerRef.current) {
      try {
        controlPeerRef.current.destroy();
      } catch {}
      controlPeerRef.current = null;
    }

    // Enable auto-join for next startup
    setAutoJoinPeer(true);
    setJoiningPeer(true);
    setPeerSenderIds([]);
    setPeerSenderNames({});

    // Add timeout for joining
    joinPhaseRef.current = "initializing";
    const joinTimeout = setTimeout(() => {
      setJoiningPeer(false);
      setErrorMessage(
        `Connection timeout during: ${joinPhaseRef.current}. The signaling server may be slow or unreachable. Try again in a moment.`,
      );
      if (controlPeerRef.current) {
        try {
          controlPeerRef.current.destroy();
        } catch {}
        controlPeerRef.current = null;
      }
    }, 10000);

    const rootId = PeerMeshUtils.createRootId(domain, peerCode);
    const start = () => {
      try {
        joinPhaseRef.current = "claiming leader role";
        const leaderPeer = new Peer(rootId, peerServerOptions);
        controlPeerRef.current = leaderPeer;
        // Maintain all control connections and sender IDs
        const controlConns = new Set<DataConnection>();
        const receiverConns = new Set<DataConnection>();
        const senderIds = new Set<string>();
        const senderNames: Record<string, string> = {};
        const senderConnMap = new Map<string, string>(); // Map connection peer ID to sender data ID
        const selfId = peerRef.current?.id;
        if (selfId) senderIds.add(selfId);
        if (selfId && playerName) senderNames[selfId] = playerName;
        leaderPeer.on("connection", (conn) => {
          controlConns.add(conn);
          conn.on("data", (_msg) => {
            const msg = _msg as ControlMsg;
            if (msg && msg.type === "hello") {
              if (msg.role === "receiver") {
                receiverConns.add(conn);
                setReceiverCount(receiverConns.size);
                conn.send({
                  type: "peer-list",
                  senders: Array.from(senderIds),
                  names: senderNames,
                  receiverCount: receiverConns.size,
                } as ControlMsg);
                // Notify all senders and other receivers about the new receiver
                controlConns.forEach((rc) => {
                  if (rc !== conn && rc.open) {
                    if (receiverConns.has(rc)) {
                      // Notify other receivers of updated count
                      rc.send({
                        type: "peer-joined",
                        role: "receiver",
                        receiverCount: receiverConns.size,
                      } as ControlMsg);
                    } else {
                      rc.send({
                        type: "peer-joined",
                        role: "receiver",
                      } as ControlMsg);
                    }
                  }
                });
              } else if (msg.role === "sender") {
                // Evict stale sender with same name (e.g. app restarted with new peer ID)
                const evicted = PeerMeshUtils.evictStaleSenderByName(
                  senderIds,
                  senderNames,
                  senderConnMap,
                  msg.id,
                  msg.name,
                  selfId,
                );
                if (evicted) {
                  controlConns.forEach((rc) => {
                    if (rc.open)
                      rc.send({ type: "peer-left", id: evicted } as ControlMsg);
                  });
                }
                if (!senderIds.has(msg.id)) {
                  senderIds.add(msg.id);
                  senderConnMap.set(conn.peer, msg.id); // Track which connection belongs to which sender
                  if (msg.name) senderNames[msg.id] = msg.name;
                  // Send full list to this sender, including receiver count
                  conn.send({
                    type: "peer-list",
                    senders: Array.from(senderIds),
                    names: senderNames,
                    receiverCount: receiverConns.size,
                  } as ControlMsg);
                  // Notify all control peers (senders and receivers)
                  controlConns.forEach((rc) => {
                    if (rc !== conn && rc.open) {
                      rc.send({
                        type: "peer-joined",
                        role: "sender",
                        id: msg.id,
                        name: senderNames[msg.id],
                      } as ControlMsg);
                    }
                  });
                }
                // Update local state (exclude self)
                setPeerSenderIds(
                  Array.from(senderIds).filter((id) => id !== selfId),
                );
                setPeerSenderNames({ ...senderNames });
              }
            }
          });
          conn.on("close", () => {
            controlConns.delete(conn);
            const wasReceiver = receiverConns.has(conn);
            receiverConns.delete(conn);
            setReceiverCount(receiverConns.size);
            // Check if a sender disconnected using proper mapping
            const senderId = senderConnMap.get(conn.peer);
            if (senderId) {
              senderIds.delete(senderId);
              delete senderNames[senderId];
              senderConnMap.delete(conn.peer);
              setPeerSenderIds(
                Array.from(senderIds).filter((id) => id !== selfId),
              );
              setPeerSenderNames({ ...senderNames });
              // Notify all remaining connections that this sender left
              controlConns.forEach((rc) => {
                if (rc.open && rc !== conn) {
                  rc.send({ type: "peer-left", id: senderId } as ControlMsg);
                }
              });
            } else if (wasReceiver) {
              // Notify all senders and remaining receivers
              controlConns.forEach((rc) => {
                if (rc.open && rc !== conn) {
                  if (receiverConns.has(rc)) {
                    rc.send({
                      type: "peer-left",
                      role: "receiver",
                      receiverCount: receiverConns.size,
                    } as any);
                  } else {
                    rc.send({ type: "peer-left", role: "receiver" } as any);
                  }
                }
              });
            }
          });
        });
        leaderPeer.on("open", () => {
          setErrorMessage("");
          setInPeer(true);
          setJoiningPeer(false);
          setIsLeader(true); // Mark as leader
          setReceiverCount(0); // Initialize receiver count when becoming leader
          clearTimeout(joinTimeout);
        });
        leaderPeer.on("error", (e: any) => {
          if (e?.type === "unavailable-id") {
            becomePeerMember(rootId, joinTimeout);
          } else {
            setErrorMessage(
              `Leader error [${e?.type || "unknown"}]: ${e?.message || "Peer Mesh error"}`,
            );
            setJoiningPeer(false);
          }
        });
      } catch (e: any) {
        becomePeerMember(rootId, joinTimeout);
      }
    };
    joinPhaseRef.current = "creating data peer";
    ensureDataPeer(() => start());
  }

  function becomePeerMember(
    rootId: string,
    joinTimeout?: ReturnType<typeof setTimeout>,
  ) {
    joinPhaseRef.current = "connecting to leader";
    const memberPeer = new Peer(peerServerOptions);
    controlPeerRef.current = memberPeer;
    memberPeer.on("open", () => {
      joinPhaseRef.current = "joining mesh";
      const conn = memberPeer.connect(rootId);
      conn.on("open", () => {
        const myDataId = peerRef.current?.id;
        if (!myDataId) return;
        conn.send({
          type: "hello",
          role: "sender",
          id: myDataId,
          name: playerName,
        } as ControlMsg);
        setInPeer(true);
        setJoiningPeer(false);
        setIsLeader(false); // Mark as member
        setErrorMessage("");
        if (joinTimeout) clearTimeout(joinTimeout);
      });
      conn.on("close", () => {
        // Leader disappeared; try to become leader only if we didn't manually disconnect
        if (manualDisconnectRef.current) {
          // User manually left the mesh, don't try to reconnect
          conn.removeAllListeners();
          setInPeer(false);
          setJoiningPeer(false);
          return;
        }
        try {
          const leaderPeer = new Peer(rootId, peerServerOptions);
          controlPeerRef.current = leaderPeer;
          const receiverConns = new Set<DataConnection>();
          const senderIds = new Set<string>();
          const senderNames: Record<string, string> = {};
          const senderConnMap = new Map<string, string>(); // Map connection peer ID to sender data ID
          const selfId = peerRef.current?.id;
          if (selfId) senderIds.add(selfId);
          if (selfId && playerName) senderNames[selfId] = playerName;
          leaderPeer.on("connection", (c) => {
            c.on("data", (_msg) => {
              const msg = _msg as ControlMsg;
              if (msg && msg.type === "hello") {
                if (msg.role === "receiver") {
                  receiverConns.add(c);
                  setReceiverCount(receiverConns.size);
                  c.send({
                    type: "peer-list",
                    senders: Array.from(senderIds),
                    names: senderNames,
                    receiverCount: receiverConns.size,
                  } as ControlMsg);
                  // Notify other receivers of updated count
                  receiverConns.forEach((rc) => {
                    if (rc !== c && rc.open) {
                      rc.send({
                        type: "peer-joined",
                        role: "receiver",
                        receiverCount: receiverConns.size,
                      } as ControlMsg);
                    }
                  });
                } else if (msg.role === "sender") {
                  // Evict stale sender with same name (e.g. app restarted with new peer ID)
                  const evicted = PeerMeshUtils.evictStaleSenderByName(
                    senderIds,
                    senderNames,
                    senderConnMap,
                    msg.id,
                    msg.name,
                    selfId,
                  );
                  if (evicted) {
                    receiverConns.forEach((rc) => {
                      if (rc.open)
                        rc.send({
                          type: "peer-left",
                          id: evicted,
                        } as ControlMsg);
                    });
                  }
                  if (!senderIds.has(msg.id)) {
                    senderIds.add(msg.id);
                    senderConnMap.set(c.peer, msg.id); // Track which connection belongs to which sender
                    if (msg.name) senderNames[msg.id] = msg.name;
                    // Send peer-list to the new sender with receiver count
                    c.send({
                      type: "peer-list",
                      senders: Array.from(senderIds),
                      names: senderNames,
                      receiverCount: receiverConns.size,
                    } as ControlMsg);
                    // Notify all receivers about the new sender
                    receiverConns.forEach((rc) => {
                      if (rc.open)
                        rc.send({
                          type: "peer-joined",
                          role: "sender",
                          id: msg.id,
                          name: senderNames[msg.id],
                        } as ControlMsg);
                    });
                  }
                }
              }
            });
            c.on("close", () => {
              const wasReceiver = receiverConns.has(c);
              receiverConns.delete(c);
              if (wasReceiver) {
                setReceiverCount(receiverConns.size);
              }
              // Check if a sender disconnected using proper mapping
              const senderId = senderConnMap.get(c.peer);
              if (senderId) {
                senderIds.delete(senderId);
                delete senderNames[senderId];
                senderConnMap.delete(c.peer);
                setPeerSenderIds(
                  Array.from(senderIds).filter((id) => id !== selfId),
                );
                setPeerSenderNames({ ...senderNames });
                // Notify all remaining connections that this sender left
                receiverConns.forEach((rc) => {
                  if (rc.open) {
                    rc.send({ type: "peer-left", id: senderId } as ControlMsg);
                  }
                });
              } else if (wasReceiver) {
                // Notify remaining receivers of updated count
                receiverConns.forEach((rc) => {
                  if (rc.open) {
                    rc.send({
                      type: "peer-left",
                      role: "receiver",
                      receiverCount: receiverConns.size,
                    } as any);
                  }
                });
              }
            });
          });
          leaderPeer.on("open", () => {
            setInPeer(true);
            setPeerSenderIds(
              Array.from(senderIds).filter((id) => id !== selfId),
            );
            setIsLeader(true); // Mark as leader when transitioning
            setReceiverCount(0); // Initialize receiver count when transitioning to leader
            setJoiningPeer(false);
            if (joinTimeout) clearTimeout(joinTimeout);
          });
          leaderPeer.on("error", (e: any) => {
            if (e?.type === "unavailable-id") {
              // someone else won; rejoin as member
              becomePeerMember(rootId, joinTimeout);
            } else {
              setErrorMessage(
                `Leader promotion error [${e?.type || "unknown"}]: ${e?.message || "Unknown error"}`,
              );
              setJoiningPeer(false);
            }
          });
        } catch (e: any) {
          setErrorMessage(
            `Leader promotion failed: ${e?.message || "Unknown error"}`,
          );
          setJoiningPeer(false);
        }
      });
      conn.on("data", (_msg) => {
        const msg = _msg as ControlMsg;
        const selfId = peerRef.current?.id;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "peer-list") {
          setPeerSenderIds(PeerMeshUtils.updateSenderList(msg.senders, selfId));
          const names = (msg as any).names as
            | Record<string, string>
            | undefined;
          if (names) {
            setPeerSenderNames(names);
          }
          // Update receiver count if provided
          const receiverCount = (msg as any).receiverCount;
          if (typeof receiverCount === "number") {
            setReceiverCount(receiverCount);
          }
          // Connect to other senders' data peers
          msg.senders.forEach((senderId) => {
            if (senderId !== selfId) {
              connectToSenderDataPeer(senderId);
            }
          });
        } else if (msg.type === "peer-joined") {
          if (msg.role === "sender" && msg.id) {
            const senderId = msg.id;
            setPeerSenderIds((prev) =>
              PeerMeshUtils.addSenderToList(prev, senderId, selfId),
            );
            setPeerSenderNames((prev) =>
              PeerMeshUtils.updateSenderNames(prev, senderId, msg.name),
            );
            // Connect to the new sender's data peer
            if (senderId !== selfId) {
              connectToSenderDataPeer(senderId);
            }
          } else if (msg.role === "receiver") {
            // A new receiver joined, increment the count only if we're a member (not leader)
            // Leaders manage their own receiver count via receiverConns.size
            if (!isLeader) {
              setReceiverCount((prev) => prev + 1);
            }
          }
        } else if (msg.type === "peer-left") {
          if ((msg as any).role === "receiver") {
            // A receiver left, decrement the count only if we're a member (not leader)
            if (!isLeader) {
              setReceiverCount((prev) => Math.max(0, prev - 1));
            }
          } else if (msg.id) {
            // A sender left
            setPeerSenderIds((prev) =>
              PeerMeshUtils.removeSenderFromList(prev, msg.id),
            );
            setPeerSenderNames((prev) =>
              PeerMeshUtils.removeSenderName(prev, msg.id),
            );
            // Clean up data connection and remote player data
            const dataConn = senderDataConnectionsRef.current[msg.id];
            if (dataConn) {
              dataConn.close();
              delete senderDataConnectionsRef.current[msg.id];
            }
            peersStoreRemove(msg.id);
            setSenderDataConnStatus((prev) => {
              const next = { ...prev };
              delete next[msg.id];
              return next;
            });
          }
        }
      });
    });
    memberPeer.on("error", (e: any) =>
      setErrorMessage(
        `Member error [${e?.type || "unknown"}]: ${e?.message || "Unknown error"}`,
      ),
    );
  }

  if (hidden) {
    return <></>;
  }

  const hasConnections = Object.keys(connectionStore.connections).length > 0;

  return (
    <Dialog>
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                hasConnections
                  ? "text-green-400"
                  : isConnected
                    ? "text-yellow-500"
                    : "text-orange-500",
              )}
            >
              <Cast className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Peer Link</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Peer Link</DialogTitle>
            {errorMessage && (
              <Tooltip delayDuration={200} disableHoverableContent>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px]">
                  <p className="text-red-500">{errorMessage}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <Tooltip delayDuration={200} disableHoverableContent>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">What is this?</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[360px] space-y-2">
                <p>
                  Stream your player position
                  {withoutLiveMode ? "" : " and spawned nodes"} directly to a
                  browser (phone, tablet, PC). Connections are peer‑to‑peer and
                  do not go through our servers; signaling is only used to
                  establish the link.
                </p>
                <p>
                  <strong>Peer Code:</strong> Enter the same code on all
                  peermate apps and browsers to connect them together
                  automatically. Generate a random code or create your own -
                  just make sure everyone uses the exact same code.
                </p>
                <p>
                  The first person to join becomes the coordinator temporarily,
                  but all gameplay data flows directly between peers.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <DialogDescription className="sr-only">
            Stream your player position to other devices over a peer link.
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-2">
          {/* toasts show errors/status */}
          <div className="space-y-2">
            {/* Player Name input (shown above Peer Code) */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="playerName">Player Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter a name to help identify your player"
                  className="flex-1"
                />
                <label
                  className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-input"
                  title="Marker color"
                  style={{ backgroundColor: playerColor }}
                >
                  <input
                    type="color"
                    aria-label="Marker color"
                    value={playerColor}
                    onChange={(e) => setPlayerColor(e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Your name and color appear on teammates&apos; maps so they can
                tell your marker apart.
              </p>
            </div>

            {/* Peer Code input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="peerCode">Peer Code</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setPeerCode(
                      PeerMeshUtils.createRandomWord(
                        "abcdefghijklmnopqrstuvwxyz0123456789",
                        8,
                      ),
                    )
                  }
                  disabled={joiningPeer || inPeer}
                  className="text-xs h-auto p-1"
                >
                  <Shuffle className="h-3 w-3 mr-1" />
                  Generate
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="peerCode"
                  type="text"
                  value={peerCode}
                  onChange={(e) => setPeerCode(e.target.value)}
                  placeholder="e.g. abcdef12"
                  disabled={joiningPeer || inPeer}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Copy Peer Code"
                  onClick={() =>
                    peerCode && navigator.clipboard.writeText(peerCode)
                  }
                  disabled={!peerCode || joiningPeer}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Tooltip delayDuration={200} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="Show QR Code"
                      disabled={!peerCode}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="p-2">
                    <QR
                      value={
                        peerCode
                          ? `https://${domain}.th.gl?peer_code=${peerCode}`
                          : `https://${domain}.th.gl`
                      }
                    />
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Button
              type="button"
              className="w-full"
              variant={inPeer ? "destructive" : "default"}
              disabled={!peerCode || !playerName || joiningPeer}
              onClick={() => (inPeer ? leavePeerMesh() : joinPeerMesh())}
            >
              {joiningPeer
                ? "Joining..."
                : inPeer
                  ? "Leave Peer Mesh"
                  : "Join Peer Mesh"}
            </Button>

            {/* List of connected senders/apps */}
            <div className="space-y-2 relative">
              <Label>Apps ({peerSenderIds.length})</Label>
              <div className="relative">
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-1">
                    {peerSenderIds.length > 0 ? (
                      peerSenderIds.map((id) => (
                        <div
                          key={id}
                          className="flex items-center gap-2 py-1 px-2 rounded bg-accent/20"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              senderDataConnStatus[id] === "receiving"
                                ? "bg-green-400"
                                : senderDataConnStatus[id] === "open"
                                  ? "bg-blue-400"
                                  : senderDataConnStatus[id] === "failed"
                                    ? "bg-red-400"
                                    : "bg-yellow-400",
                            )}
                            title={
                              senderDataConnStatus[id] === "receiving"
                                ? "Receiving data"
                                : senderDataConnStatus[id] === "open"
                                  ? "Connected (no data yet)"
                                  : senderDataConnStatus[id] === "failed"
                                    ? "Connection failed"
                                    : "Connecting..."
                            }
                          />
                          <span className="text-sm truncate">
                            {peerSenderNames[id] || id}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {inPeer
                          ? "No other apps connected yet."
                          : "No apps connected."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {inPeer && peerSenderIds.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  receiving
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  connected
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  connecting
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  failed
                </span>
              </div>
            )}

            {/* Connected receivers count */}
            <div className="space-y-2">
              <Label>Browsers ({receiverCount})</Label>
              {receiverCount > 0 ? (
                <div className="space-y-2">
                  <div className="rounded-md border p-2 bg-accent/5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>
                        {receiverCount} browser{receiverCount !== 1 ? "s" : ""}{" "}
                        receiving player data
                      </span>
                    </div>
                  </div>
                  {receiversNeedingActors > 0 && (
                    <div className="rounded-md border p-2 bg-accent/5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>
                          {receiversNeedingActors} selected as "Me" (receiving
                          player + actors)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">
                    {inPeer
                      ? "No browsers connected yet."
                      : "No browsers connected."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
