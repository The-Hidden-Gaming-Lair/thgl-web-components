"use client";

import {
  cn,
  isLiveReadingActive,
  useAccountStore,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
import type { ActorPlayer, Actor } from "@repo/lib/overwolf";
import Peer, { DataConnection } from "peerjs";
import { RemotePlayer, usePeersStore } from "../(providers)/peers-store";
import {
  PeerMeshUtils,
  peerServerOptions,
  type ControlMsg,
} from "../(providers)/peer-mesh-utils";
import { useEffect, useRef, useState } from "react";

// PeerJS's "close" event isn't always fired when a tab is hard-killed,
// refreshed, or the OS shuts down — the remote side has to detect the dead
// connection via ICE timeout, and that signal sometimes never propagates up
// to PeerJS. Result: stale entries pile up in the leader's receiverConns /
// senderIds maps every time someone refreshes.
//
// Watch the underlying RTCPeerConnection's state directly so we react to
// "failed"/"closed" event-driven, plus give "disconnected" a 30s grace
// window for transient network blips. When we decide it's dead we just call
// conn.close() — PeerJS then fires its own "close" event which the existing
// per-leader cleanup handlers already listen to.
function attachConnectionStateWatcher(conn: DataConnection) {
  const pc = conn.peerConnection;
  if (!pc) return;
  let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const clearDisconnectTimer = () => {
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }
  };
  const killIfOpen = () => {
    if (conn.open) {
      try {
        conn.close();
      } catch {
        /* already closing */
      }
    }
  };
  pc.addEventListener("connectionstatechange", () => {
    const state = pc.connectionState;
    if (state === "failed" || state === "closed") {
      clearDisconnectTimer();
      killIfOpen();
    } else if (state === "disconnected") {
      // Transient: could recover. Give it a grace window before kicking.
      if (!disconnectTimer) {
        disconnectTimer = setTimeout(() => {
          disconnectTimer = null;
          if (pc.connectionState !== "connected") {
            killIfOpen();
          }
        }, 30000);
      }
    } else if (state === "connected") {
      clearDisconnectTimer();
    }
  });
}
import { useShallow } from "zustand/react/shallow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Cast, Copy, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { LiveModeControl, ScrollArea, Switch } from "../(controls)";

export function StreamingReceiver({
  className,
  domain,
  withoutLiveMode,
}: {
  className?: string;
  domain: string;
  withoutLiveMode?: boolean;
}) {
  const {
    setLiveMode,
    liveMode,
    peerCode,
    setPeerCode,
    lastMeSenderId,
    setLastMeSenderId,
    autoJoinPeer,
    setAutoJoinPeer,
    autoLiveModeWithMe,
    setAutoLiveModeWithMe,
    showPeerLabels,
    setShowPeerLabels,
    _hasHydrated,
  } = useSettingsStore(
    useShallow((state) => ({
      setLiveMode: state.setLiveMode,
      liveMode: state.liveMode,
      peerCode: state.peerCode,
      setPeerCode: state.setPeerCode,
      lastMeSenderId: state.lastMeSenderId,
      setLastMeSenderId: state.setLastMeSenderId,
      autoJoinPeer: state.autoJoinPeer,
      setAutoJoinPeer: state.setAutoJoinPeer,
      autoLiveModeWithMe: state.autoLiveModeWithMe,
      setAutoLiveModeWithMe: state.setAutoLiveModeWithMe,
      showPeerLabels: state.showPeerLabels,
      setShowPeerLabels: state.setShowPeerLabels,
      _hasHydrated: state._hasHydrated,
    })),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const peerRef = useRef<Peer | null>(null);
  const controlPeerRef = useRef<Peer | null>(null);
  const controlConnectionRef = useRef<DataConnection | null>(null);
  const setPlayer = useGameState((state) => state.setPlayer);
  const setActors = useGameState((state) => state.setActors);
  const setStaticActors = useGameState((state) => state.setStaticActors);
  const setPeerLiveConnected = useGameState(
    (state) => state.setPeerLiveConnected,
  );
  const connectionsRef = useRef<Record<string, DataConnection>>({});
  const lastDataRef = useRef<Record<string, any>>({});

  const [inPeer, setInPeer] = useState(false);
  const [joiningPeer, setJoiningPeer] = useState(false);
  const [peerSenderIds, setPeerSenderIds] = useState<string[]>([]);
  const [meSenderId, setMeSenderId] = useState<string | null>(null);
  const meSenderIdRef = useRef<string | null>(null);
  const previousMeSenderIdRef = useRef<string | null>(null);
  const [peerSenderNames, setPeerSenderNames] = useState<
    Record<string, string>
  >({});
  const [receiverCount, setReceiverCount] = useState(0);
  // Per-sender data connection status: "connecting" | "direct" | "relay" | "failed"
  const [dataConnStatus, setDataConnStatus] = useState<
    Record<string, "connecting" | "direct" | "relay" | "failed">
  >({});
  const manualDisconnectRef = useRef(false);
  const leavingTeamRef = useRef(false);
  const joinPhaseRef = useRef("");

  const peersStoreSetPlayer = usePeersStore((s) => s.setRemotePlayer);
  const peersStoreSetActors = usePeersStore((s) => s.setRemoteActors);
  const peersStoreRemove = usePeersStore((s) => s.removePeer);
  const peersStoreClear = usePeersStore((s) => s.clear);

  // Auto-join peer mesh on load if we have a saved peer code and auto-join is enabled
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!peerCode) return;
    if (!autoJoinPeer) return;
    if (joiningPeer || inPeer) return;
    // Join the peer mesh automatically
    joinPeerMesh();
  }, [_hasHydrated]);

  // Restore saved "Me" selection if available or auto-select first app
  useEffect(() => {
    if (!inPeer) return;
    if (peerSenderIds.length === 0) return;
    if (lastMeSenderId && peerSenderIds.includes(lastMeSenderId)) {
      if (meSenderId !== lastMeSenderId) setMeSenderId(lastMeSenderId);
    } else if (!meSenderId && peerSenderIds.length > 0) {
      // Auto-select first connected app as "Me"
      setMeSenderId(peerSenderIds[0]);
    }
  }, [inPeer, peerSenderIds, lastMeSenderId]);
  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    meSenderIdRef.current = meSenderId;
  }, [meSenderId]);

  // Persist selection while in a mesh; keep for future reconnect
  useEffect(() => {
    if (inPeer) {
      const previousSender = previousMeSenderIdRef.current;

      // Send unset-me directly to previous sender's data connection if there was one
      if (previousSender && previousSender !== meSenderId) {
        const prevConn = connectionsRef.current[previousSender];
        if (prevConn && prevConn.open) {
          console.log("Sending unset-me to previous sender", previousSender);
          prevConn.send({
            type: "unset-me",
          });
        }
      }

      if (meSenderId) {
        setLastMeSenderId(meSenderId);
        // Notify the selected sender directly through its data connection
        const conn = connectionsRef.current[meSenderId];
        if (conn && conn.open) {
          console.log("Sending set-me to new sender", meSenderId);
          conn.send({
            type: "set-me",
          });
        }
      } else {
        // No "Me" selected - clear player state
        setPlayer(null);
        setActors([]);
        setStaticActors([]);
      }

      // Update previous sender reference
      previousMeSenderIdRef.current = meSenderId;

      // Re-process all last known data with new "Me" selection
      Object.entries(lastDataRef.current).forEach(([peerId, data]) => {
        if (meSenderId && peerId === meSenderId) {
          // This peer is now "Me"
          if (data.player) {
            setPlayer(data.player as ActorPlayer);
          }
          if (data.actors) {
            setActors(data.actors as Actor[]);
          }
          // Remove from peers store since it's now "Me"
          peersStoreRemove(peerId);
        } else {
          // This peer is a teammate (or all are teammates if no "Me" selected)
          if (data.player) {
            peersStoreSetPlayer(peerId, data.player as RemotePlayer);
          }
          if (data.actors) {
            peersStoreSetActors(peerId, data.actors as Actor[]);
          }
        }
      });
    }
  }, [meSenderId, inPeer, setLastMeSenderId]);
  // Clear selection when no mesh is connected
  useEffect(() => {
    if (!inPeer) {
      setMeSenderId(null);
    }
  }, [inPeer]);

  // Automatic Live Mode control based on Me selection and AutoLiveMode setting.
  // Auto-enable picks 'combined' only for Elite (preview-release) users —
  // free users get 'live' so we never store a mode they can't access.
  useEffect(() => {
    const liveActive = isLiveReadingActive(liveMode);
    if (withoutLiveMode) {
      if (liveActive) setLiveMode("static");
      return; // Live mode unavailable in this context
    }
    // Only auto-manage the mode when the user opted in. With Auto Live Mode
    // off, respect the manual LiveModeControl selection instead of forcing it
    // back to static (previously `autoLiveModeWithMe` was ANDed into
    // shouldBeLive, so turning it off still dragged the mode to static).
    if (!autoLiveModeWithMe) return;

    const shouldBeLive = Boolean(inPeer && meSenderId);
    if (shouldBeLive !== liveActive) {
      const hasPreview = useAccountStore.getState().perks.previewReleaseAccess;
      setLiveMode(shouldBeLive ? (hasPreview ? "combined" : "live") : "static");
    }
  }, [
    inPeer,
    meSenderId,
    autoLiveModeWithMe,
    withoutLiveMode,
    setLiveMode,
    liveMode,
  ]);

  // Expose "this session has a live source via Peer Link" globally so the map
  // (coordinates-provider) knows live/combined mode is backed by real data and
  // shouldn't fall back to showing every predicted spawn. Uses the STABLE
  // inPeer + "Me" selection — not transient player/actors, which empty out on
  // loading screens. Reset on unmount so navigating away clears it.
  useEffect(() => {
    setPeerLiveConnected(inPeer && !!meSenderId);
  }, [inPeer, meSenderId, setPeerLiveConnected]);
  useEffect(() => () => setPeerLiveConnected(false), [setPeerLiveConnected]);

  function getConnectionType(stats: RTCStatsReport): "relay" | "direct" {
    let result: "relay" | "direct" = "direct";
    stats.forEach((report: any) => {
      if (result === "relay") return;
      if (
        report.type === "candidate-pair" &&
        (report.state === "succeeded" || report.selected)
      ) {
        const localId = report.localCandidateId;
        stats.forEach((r: any) => {
          if (r.id === localId && r.candidateType === "relay") {
            result = "relay";
          }
        });
      }
    });
    return result;
  }

  function detectConnectionType(conn: DataConnection, peerId: string) {
    try {
      const pc = conn.peerConnection;
      if (!pc) return;
      // Small delay to let ICE settle
      setTimeout(() => {
        pc.getStats().then((stats) => {
          const type = getConnectionType(stats);
          setDataConnStatus((prev) => ({ ...prev, [peerId]: type }));
          if (type === "relay") {
            tryUpgradeToDirectConnection(conn, peerId);
          }
        });
      }, 1000);
    } catch {
      // Stats API not available
    }
  }

  // When a relay connection is detected, try to establish a direct one
  // by reconnecting. If direct succeeds, swap it in. Otherwise keep relay.
  function tryUpgradeToDirectConnection(
    relayConn: DataConnection,
    peerId: string,
  ) {
    const peer = peerRef.current;
    if (!peer || peer.disconnected || peer.destroyed) return;

    console.log("Attempting direct upgrade for", peerId);
    const directConn = peer.connect(peerId);
    if (!directConn) return;

    const upgradeTimeout = setTimeout(() => {
      // Direct attempt timed out, keep relay
      console.log("Direct upgrade timed out for", peerId, "keeping relay");
      directConn.removeAllListeners();
      try {
        directConn.close();
      } catch {}
    }, 8000);

    directConn.on("open", () => {
      const pc = directConn.peerConnection;
      if (!pc) {
        clearTimeout(upgradeTimeout);
        try {
          directConn.close();
        } catch {}
        return;
      }
      // Wait a moment for ICE to settle, then check if it's direct
      setTimeout(() => {
        pc.getStats().then((stats) => {
          clearTimeout(upgradeTimeout);
          const type = getConnectionType(stats);
          if (type === "direct") {
            console.log("Direct upgrade succeeded for", peerId);
            // Swap: set up the new direct connection and close the old relay
            relayConn.removeAllListeners();
            try {
              relayConn.close();
            } catch {}
            // Re-initialize with the direct connection
            connectionsRef.current[peerId] = directConn;
            setDataConnStatus((prev) => ({ ...prev, [peerId]: "direct" }));
            directConn.on("data", (data) => {
              if (typeof data !== "object" || data === null) return;
              lastDataRef.current[peerId] = data;
              processIncomingData(peerId, data);
            });
            directConn.on("close", () => {
              delete connectionsRef.current[peerId];
              delete lastDataRef.current[peerId];
              peersStoreRemove(peerId);
              setDataConnStatus((prev) => {
                const next = { ...prev };
                delete next[peerId];
                return next;
              });
            });
            directConn.on("error", () => {
              delete connectionsRef.current[peerId];
              delete lastDataRef.current[peerId];
              peersStoreRemove(peerId);
              setDataConnStatus((prev) => ({ ...prev, [peerId]: "failed" }));
            });
            // Re-send set-me if needed
            if (meSenderIdRef.current === peerId) {
              directConn.send({ type: "set-me" });
            }
          } else {
            // Still relay, keep the original
            console.log("Direct upgrade failed for", peerId, "keeping relay");
            directConn.removeAllListeners();
            try {
              directConn.close();
            } catch {}
          }
        });
      }, 1000);
    });

    directConn.on("error", () => {
      clearTimeout(upgradeTimeout);
      // Direct attempt failed, relay stays
    });
  }

  function processIncomingData(peerId: string, data: any) {
    // Use the ref to get the latest meSenderId value
    const currentMeSenderId = meSenderIdRef.current;

    if (currentMeSenderId && peerId === currentMeSenderId) {
      // This peer is selected as "Me"
      if (data.player) {
        setPlayer(data.player as ActorPlayer);
      }
      if (data.actors) {
        setActors(data.actors as Actor[]);
      }
      // Remove from peers store since it's "Me"
      peersStoreRemove(peerId);
    } else {
      // This peer is a teammate - only store player position, not actors
      if (data.player) {
        peersStoreSetPlayer(peerId, data.player as RemotePlayer);
      }
      // Note: actors are not stored for teammates, only for "Me" sender
    }
  }

  function initializeDataConnection(conn: DataConnection) {
    const peerId = conn.peer;
    connectionsRef.current[peerId] = conn;
    setDataConnStatus((prev) => ({ ...prev, [peerId]: "connecting" }));

    // Set a timeout for the connection to open
    const connectionTimeout = setTimeout(() => {
      if (!conn.open) {
        console.log("Connection timeout for", peerId);
        conn.removeAllListeners();
        conn.close();
        delete connectionsRef.current[peerId];
        // Remove stale sender from the list — can't get data from them
        setPeerSenderIds((prev) => prev.filter((id) => id !== peerId));
        setPeerSenderNames((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
        peersStoreRemove(peerId);
        setDataConnStatus((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    }, 10000); // 10 second timeout

    conn.on("open", () => {
      clearTimeout(connectionTimeout);
      // Detect if using relay (TURN) or direct connection
      detectConnectionType(conn, peerId);
      // If this sender is already selected as "Me", send set-me message
      if (meSenderIdRef.current === peerId) {
        console.log("Sending set-me to pre-selected sender", peerId);
        conn.send({
          type: "set-me",
        });
      }
    });
    conn.on("data", (data) => {
      if (typeof data !== "object" || data === null) {
        return;
      }
      // Store last data for potential re-processing
      lastDataRef.current[peerId] = data;

      // Always process the data based on current meSenderId
      processIncomingData(peerId, data);
    });
    conn.on("close", () => {
      clearTimeout(connectionTimeout);
      delete connectionsRef.current[peerId];
      delete lastDataRef.current[peerId];
      peersStoreRemove(peerId);
      setDataConnStatus((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });
    conn.on("error", (error) => {
      clearTimeout(connectionTimeout);
      console.log("Data connection error for", peerId, error);
      delete connectionsRef.current[peerId];
      delete lastDataRef.current[peerId];
      // Remove stale sender from the list — can't get data from them
      setPeerSenderIds((prev) => prev.filter((id) => id !== peerId));
      setPeerSenderNames((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      peersStoreRemove(peerId);
      setDataConnStatus((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      // If this was our "Me" sender and it failed, clear selection
      if (meSenderIdRef.current === peerId) {
        setMeSenderId(null);
      }
    });
  }

  function connectToPeer(onOpen?: () => void) {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    const fn = async () => {
      const PeerJs = (await import("peerjs")).default;
      peerRef.current = new PeerJs(peerServerOptions);
      peerRef.current.on("close", () => {
        console.log("peer close");
        setIsConnected(false);
        Object.values(connectionsRef.current).forEach((c) => {
          c.removeAllListeners();
          c.close();
        });
        connectionsRef.current = {};
        lastDataRef.current = {};
        peersStoreClear();
      });
      peerRef.current.on("error", (error) => {
        // peer-unavailable just means a stale peer ID we tried to connect to is gone — not a real error
        if (error.type === "peer-unavailable") {
          console.log("Data peer: stale peer unavailable", error.message);
          return;
        }
        console.log("peer error", error, error.name, error.message);
        switch (error.type) {
          case "network":
            setErrorMessage("Network connection lost");
            break;
          case "server-error":
            setErrorMessage("Unable to connect to PeerServer");
            break;
          case "socket-error":
            setErrorMessage("Socket connection failed");
            break;
          case "webrtc":
            setErrorMessage("WebRTC connection failed");
            break;
          default:
            setErrorMessage(error.message || "Connection error");
        }
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
        initializeDataConnection(conn);
      });
      peerRef.current.on("disconnected", () => {
        console.log("peer disconnected from server");
        setIsConnected(false);
        if (!manualDisconnectRef.current && !leavingTeamRef.current) {
          // Try to reconnect to PeerServer
          try {
            peerRef.current?.reconnect();
          } catch (e) {
            console.log("Failed to reconnect:", e);
          }
        }
      });
      // Note: 'close' event is handled by the peer close handler we added earlier
    };
    fn();
  }
  function ensurePeerReady(onReady: () => void) {
    if (peerRef.current && !peerRef.current.disconnected) {
      onReady();
      return;
    }
    connectToPeer(onReady);
  }

  function leavePeerMesh() {
    setMeSenderId(null);
    leavingTeamRef.current = true;
    manualDisconnectRef.current = true; // Prevent auto-reconnection

    // Destroy control peer
    if (controlPeerRef.current) {
      try {
        controlPeerRef.current.destroy();
      } catch {}
      controlPeerRef.current = null;
    }
    controlConnectionRef.current = null;

    // Clean up all data connections properly
    Object.values(connectionsRef.current).forEach((c) => {
      c.removeAllListeners();
      c.close();
    });
    connectionsRef.current = {};
    lastDataRef.current = {};

    // Also destroy the data peer to prevent any incoming connections
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {}
      peerRef.current = null;
    }

    // Clear peer store
    peersStoreClear();

    setInPeer(false);
    setPeerSenderIds([]);
    setPeerSenderNames({});
    setReceiverCount(0);
    setDataConnStatus({});
    // Disable auto-join to prevent immediate reconnection
    setAutoJoinPeer(false);
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
    leavingTeamRef.current = false;
    // Clean up any existing connections before joining
    if (controlPeerRef.current) {
      try {
        controlPeerRef.current.destroy();
      } catch {}
      controlPeerRef.current = null;
    }
    Object.values(connectionsRef.current).forEach((c) => c.close());
    connectionsRef.current = {};
    lastDataRef.current = {};
    peersStoreClear(); // Clear all peer data when rejoining

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
    // Ensure our data peer has an ID before joining, so we can announce to the leader
    joinPhaseRef.current = "creating data peer";
    ensurePeerReady(() => {
      // Prefer joining as member first; if no leader exists, we'll promote to leader.
      joinPhaseRef.current = "connecting to leader";
      becomePeerMember(rootId, joinTimeout);
    });
  }

  function becomePeerMember(
    rootId: string,
    joinTimeout?: ReturnType<typeof setTimeout>,
  ) {
    const memberPeer = new Peer(peerServerOptions);
    controlPeerRef.current = memberPeer;
    memberPeer.on("open", () => {
      joinPhaseRef.current = "joining mesh";
      const conn = memberPeer.connect(rootId);
      controlConnectionRef.current = conn;
      let promoteTimer: ReturnType<typeof setTimeout> | null = setTimeout(
        () => {
          // If no leader responds in time, become coordinator
          try {
            const leaderPeer = new Peer(rootId, peerServerOptions);
            controlPeerRef.current = leaderPeer;
            const receiverConns = new Map<string, DataConnection>();
            const senderIds = new Set<string>();
            const senderNames: Record<string, string> = {};
            const senderConnMap = new Map<string, string>();
            leaderPeer.on("connection", (conn) => {
              conn.on("data", (_msg) => {
                const msg = _msg as ControlMsg;
                if (msg && msg.type === "hello") {
                  if (msg.role === "sender") {
                    // Evict stale sender with same name (e.g. app restarted)
                    const evicted = PeerMeshUtils.evictStaleSenderByName(
                      senderIds,
                      senderNames,
                      senderConnMap,
                      msg.id,
                      msg.name,
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
                      senderConnMap.set(conn.peer, msg.id);
                      if (msg.name) {
                        senderNames[msg.id] = msg.name;
                      }
                      conn.send({
                        type: "peer-list",
                        senders: Array.from(senderIds),
                        names: senderNames,
                      } as ControlMsg);
                      setPeerSenderIds(Array.from(senderIds));
                      setPeerSenderNames(senderNames);
                      receiverConns.forEach((rc, id) => {
                        if (rc.open && id !== conn.peer) {
                          rc.send({
                            type: "peer-joined",
                            role: "sender",
                            id: msg.id,
                            name: senderNames[msg.id],
                          } as ControlMsg);
                        }
                      });
                      if (!connectionsRef.current[msg.id]) {
                        ensurePeerReady(() => {
                          if (
                            !peerRef.current ||
                            connectionsRef.current[msg.id]
                          )
                            return;
                          const dc = peerRef.current.connect(msg.id);
                          initializeDataConnection(dc);
                        });
                      }
                    }
                  } else if (msg.role === "receiver") {
                    receiverConns.set(conn.peer, conn);
                    conn.send({
                      type: "peer-list",
                      senders: Array.from(senderIds),
                      names: senderNames,
                      receiverCount: receiverConns.size,
                    } as ControlMsg);
                    receiverConns.forEach((rc, id) => {
                      if (id !== conn.peer && rc.open) {
                        rc.send({
                          type: "peer-joined",
                          role: "receiver",
                          receiverCount: receiverConns.size,
                        } as ControlMsg);
                      }
                    });
                  }
                }
              });
              conn.on("close", () => {
                const wasReceiver = receiverConns.has(conn.peer);
                receiverConns.delete(conn.peer);
                const senderId = senderConnMap.get(conn.peer);
                if (senderId) {
                  senderIds.delete(senderId);
                  delete senderNames[senderId];
                  senderConnMap.delete(conn.peer);
                  setPeerSenderIds(Array.from(senderIds));
                  setPeerSenderNames({ ...senderNames });
                  receiverConns.forEach((rc) => {
                    if (rc.open) {
                      rc.send({
                        type: "peer-left",
                        id: senderId,
                      } as ControlMsg);
                    }
                  });
                } else if (wasReceiver) {
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
              attachConnectionStateWatcher(conn);
            });
            leaderPeer.on("open", () => {
              setErrorMessage("");
              setInPeer(true);
              setPeerSenderIds(Array.from(senderIds));
              setTimeout(() => setJoiningPeer(false), 100);
              if (joinTimeout) clearTimeout(joinTimeout);
            });
            leaderPeer.on("error", (err: any) => {
              if (err?.type === "unavailable-id") {
                setJoiningPeer(true);
                becomePeerMember(rootId);
              } else {
                setErrorMessage(
                  `Leader promotion error [${err?.type || "unknown"}]: ${err?.message || "Unknown error"}`,
                );
                setJoiningPeer(false);
              }
            });
          } catch (err: any) {
            setErrorMessage(
              `Leader promotion failed: ${err?.message || "Unknown error"}`,
            );
            setJoiningPeer(false);
          }
        },
        1500,
      );
      conn.on("open", () => {
        const myDataId = peerRef.current?.id;
        if (!myDataId) {
          ensurePeerReady(() => {});
        }
        conn.send({
          type: "hello",
          role: "receiver",
          id: myDataId,
        } as ControlMsg);
        setInPeer(true);
        setErrorMessage("");
        // Delay clearing joining state to avoid flicker
        setTimeout(() => setJoiningPeer(false), 100);
        if (joinTimeout) clearTimeout(joinTimeout);
        if (promoteTimer) {
          clearTimeout(promoteTimer);
          promoteTimer = null;
        }
      });
      conn.on("error", (e: any) => {
        if (e?.type === "peer-unavailable") {
          // No leader exists - become coordinator
          // Keep joiningPeer true while we transition to leader
          try {
            const leaderPeer = new Peer(rootId, peerServerOptions);
            controlPeerRef.current = leaderPeer;
            const receiverConns = new Map<string, DataConnection>();
            const senderIds = new Set<string>();
            const senderNames: Record<string, string> = {};
            const senderConnMap = new Map<string, string>();
            leaderPeer.on("connection", (conn) => {
              conn.on("data", (_msg) => {
                const msg = _msg as ControlMsg;
                if (msg && msg.type === "hello") {
                  if (msg.role === "sender") {
                    // Evict stale sender with same name (e.g. app restarted)
                    const evicted = PeerMeshUtils.evictStaleSenderByName(
                      senderIds,
                      senderNames,
                      senderConnMap,
                      msg.id,
                      msg.name,
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
                      senderConnMap.set(conn.peer, msg.id);
                      if (msg.name) {
                        senderNames[msg.id] = msg.name;
                      }
                      conn.send({
                        type: "peer-list",
                        senders: Array.from(senderIds),
                        names: senderNames,
                      } as ControlMsg);
                      setPeerSenderIds(Array.from(senderIds));
                      setPeerSenderNames(senderNames);
                      receiverConns.forEach((rc, id) => {
                        if (rc.open && id !== conn.peer) {
                          rc.send({
                            type: "peer-joined",
                            role: "sender",
                            id: msg.id,
                            name: senderNames[msg.id],
                          } as ControlMsg);
                        }
                      });
                      if (!connectionsRef.current[msg.id]) {
                        ensurePeerReady(() => {
                          if (
                            !peerRef.current ||
                            connectionsRef.current[msg.id]
                          )
                            return;
                          const dc = peerRef.current.connect(msg.id);
                          initializeDataConnection(dc);
                        });
                      }
                    }
                  } else if (msg.role === "receiver") {
                    receiverConns.set(conn.peer, conn);
                    conn.send({
                      type: "peer-list",
                      senders: Array.from(senderIds),
                      names: senderNames,
                      receiverCount: receiverConns.size,
                    } as ControlMsg);
                    receiverConns.forEach((rc, id) => {
                      if (id !== conn.peer && rc.open) {
                        rc.send({
                          type: "peer-joined",
                          role: "receiver",
                          receiverCount: receiverConns.size,
                        } as ControlMsg);
                      }
                    });
                  }
                }
              });
              conn.on("close", () => {
                const wasReceiver = receiverConns.has(conn.peer);
                receiverConns.delete(conn.peer);
                const senderId = senderConnMap.get(conn.peer);
                if (senderId) {
                  senderIds.delete(senderId);
                  delete senderNames[senderId];
                  senderConnMap.delete(conn.peer);
                  setPeerSenderIds(Array.from(senderIds));
                  setPeerSenderNames({ ...senderNames });
                  receiverConns.forEach((rc) => {
                    if (rc.open) {
                      rc.send({
                        type: "peer-left",
                        id: senderId,
                      } as ControlMsg);
                    }
                  });
                } else if (wasReceiver) {
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
              attachConnectionStateWatcher(conn);
            });
            leaderPeer.on("open", () => {
              setErrorMessage("");
              setInPeer(true);
              setPeerSenderIds(Array.from(senderIds));
              setTimeout(() => setJoiningPeer(false), 100);
              if (joinTimeout) clearTimeout(joinTimeout);
            });
            leaderPeer.on("error", (err: any) => {
              if (err?.type === "unavailable-id") {
                // Another leader appeared; try member again
                setJoiningPeer(true);
                becomePeerMember(rootId);
              } else {
                setErrorMessage(
                  `Leader error [${err?.type || "unknown"}]: ${err?.message || "Unknown error"}`,
                );
                setJoiningPeer(false);
              }
            });
          } catch (err: any) {
            setErrorMessage(
              `Leader promotion failed: ${err?.message || "Unknown error"}`,
            );
            setJoiningPeer(false);
          }
        } else {
          setErrorMessage(
            `Connection error [${e?.type || "unknown"}]: ${e?.message || "Unknown error"}`,
          );
          setJoiningPeer(false);
        }
        if (promoteTimer) {
          clearTimeout(promoteTimer);
          promoteTimer = null;
        }
      });
      conn.on("close", () => {
        controlConnectionRef.current = null;
        // If we intentionally left, do not auto-promote to leader.
        if (leavingTeamRef.current) {
          leavingTeamRef.current = false;
          return;
        }
        // Leader went away; try to become the coordinator.
        try {
          const leaderPeer = new Peer(rootId, peerServerOptions);
          controlPeerRef.current = leaderPeer;
          const receiverConns = new Map<string, DataConnection>();
          const senderIds = new Set<string>();
          const senderNames: Record<string, string> = {};
          const senderConnMap = new Map<string, string>(); // Map connection peer ID to sender data ID
          leaderPeer.on("connection", (conn) => {
            conn.on("data", (_msg) => {
              const msg = _msg as ControlMsg;
              if (msg && msg.type === "hello") {
                if (msg.role === "sender") {
                  // Evict stale sender with same name (e.g. app restarted)
                  const evicted = PeerMeshUtils.evictStaleSenderByName(
                    senderIds,
                    senderNames,
                    senderConnMap,
                    msg.id,
                    msg.name,
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
                    senderConnMap.set(conn.peer, msg.id); // Track which connection belongs to which sender
                    if (msg.name) {
                      senderNames[msg.id] = msg.name;
                    }
                    conn.send({
                      type: "peer-list",
                      senders: Array.from(senderIds),
                      names: senderNames,
                    } as ControlMsg);
                    setPeerSenderIds(Array.from(senderIds));
                    setPeerSenderNames(senderNames);
                    receiverConns.forEach((rc, id) => {
                      if (rc.open && id !== conn.peer) {
                        rc.send({
                          type: "peer-joined",
                          role: "sender",
                          id: msg.id,
                          name: senderNames[msg.id],
                        } as ControlMsg);
                      }
                    });
                    if (!connectionsRef.current[msg.id]) {
                      ensurePeerReady(() => {
                        if (!peerRef.current || connectionsRef.current[msg.id])
                          return;
                        const dc = peerRef.current.connect(msg.id);
                        initializeDataConnection(dc);
                      });
                    }
                  }
                } else if (msg.role === "receiver") {
                  receiverConns.set(conn.peer, conn);
                  conn.send({
                    type: "peer-list",
                    senders: Array.from(senderIds),
                    names: senderNames,
                    receiverCount: receiverConns.size,
                  } as ControlMsg);
                  receiverConns.forEach((rc, id) => {
                    if (id !== conn.peer && rc.open) {
                      rc.send({
                        type: "peer-joined",
                        role: "receiver",
                        receiverCount: receiverConns.size,
                      } as ControlMsg);
                    }
                  });
                }
              }
            });
            conn.on("close", () => {
              const wasReceiver = receiverConns.has(conn.peer);
              receiverConns.delete(conn.peer);
              // Check if a sender disconnected
              const senderId = senderConnMap.get(conn.peer);
              if (senderId) {
                senderIds.delete(senderId);
                delete senderNames[senderId];
                senderConnMap.delete(conn.peer);
                setPeerSenderIds(Array.from(senderIds));
                setPeerSenderNames({ ...senderNames });
                // Notify all receivers that this sender left
                receiverConns.forEach((rc) => {
                  if (rc.open) {
                    rc.send({
                      type: "peer-left",
                      id: senderId,
                    } as ControlMsg);
                  }
                });
                // Clean up data connection and remove from peers store
                const dataConn = connectionsRef.current[senderId];
                if (dataConn) {
                  dataConn.close();
                  delete connectionsRef.current[senderId];
                }
                delete lastDataRef.current[senderId];
                peersStoreRemove(senderId);
                // If the removed sender was selected as "Me", clear selection
                if (meSenderId === senderId) {
                  setMeSenderId(null);
                  setPlayer(null);
                  setActors([]);
                  setStaticActors([]);
                }
              } else if (wasReceiver) {
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
            attachConnectionStateWatcher(conn);
          });
          leaderPeer.on("open", () => {
            setErrorMessage("");
            setInPeer(true);
            setJoiningPeer(false);
            setPeerSenderIds(Array.from(senderIds));
          });
          leaderPeer.on("error", (err: any) => {
            if (err?.type === "unavailable-id") {
              // Someone else already became leader; rejoin as member
              setJoiningPeer(true);
              becomePeerMember(rootId);
            } else {
              setErrorMessage(
                `Leader promotion error [${err?.type || "unknown"}]: ${err?.message || "Unknown error"}`,
              );
              setJoiningPeer(false);
            }
          });
        } catch (err: any) {
          setErrorMessage(
            `Leader promotion failed: ${err?.message || "Unknown error"}`,
          );
          setJoiningPeer(false);
        }
      });
      conn.on("data", (_msg) => {
        const msg = _msg as ControlMsg;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "peer-list") {
          setPeerSenderIds(msg.senders);
          const names = (msg as any).names as
            | Record<string, string>
            | undefined;
          if (names) {
            setPeerSenderNames(names);
          }
          if (typeof msg.receiverCount === "number") {
            setReceiverCount(msg.receiverCount);
          }
          for (const senderId of msg.senders) {
            if (connectionsRef.current[senderId]) continue;
            ensurePeerReady(() => {
              if (!peerRef.current || connectionsRef.current[senderId]) return;
              // Check if peer is in proper state for connections
              if (peerRef.current.disconnected || peerRef.current.destroyed)
                return;
              const c = peerRef.current.connect(senderId);
              initializeDataConnection(c);
            });
          }
        } else if (msg.type === "peer-joined" && msg.role === "receiver") {
          const rc = (msg as any).receiverCount;
          if (typeof rc === "number") setReceiverCount(rc);
        } else if (
          msg.type === "peer-joined" &&
          msg.role === "sender" &&
          msg.id
        ) {
          const senderId = msg.id;
          setPeerSenderIds((prev) =>
            PeerMeshUtils.addSenderToList(prev, senderId),
          );
          setPeerSenderNames((prev) =>
            PeerMeshUtils.updateSenderNames(prev, senderId, msg.name),
          );
          if (!connectionsRef.current[senderId]) {
            ensurePeerReady(() => {
              if (!peerRef.current || connectionsRef.current[senderId]) return;
              const c = peerRef.current.connect(senderId);
              initializeDataConnection(c);
            });
          }
        } else if (msg.type === "peer-left") {
          const rc = (msg as any).receiverCount;
          if ((msg as any).role === "receiver" && typeof rc === "number") {
            setReceiverCount(rc);
            return;
          }
          const peerId = msg.id;
          const c = connectionsRef.current[peerId];
          if (c) {
            c.removeAllListeners();
            c.close();
          }
          delete connectionsRef.current[peerId];
          delete lastDataRef.current[peerId];
          peersStoreRemove(peerId);
          setPeerSenderIds((prev) =>
            PeerMeshUtils.removeSenderFromList(prev, peerId),
          );
          setPeerSenderNames((prev) =>
            PeerMeshUtils.removeSenderName(prev, peerId),
          );
          // If the removed sender was selected as "Me", clear selection
          if (meSenderId === peerId) {
            setMeSenderId(null);
            setPlayer(null);
            setActors([]);
            setStaticActors([]);
          }
        }
      });
    });
    memberPeer.on("error", (e: any) => {
      // peer-unavailable is expected when no leader exists yet;
      // conn.on("error") handles promotion to leader, so ignore it here.
      if (e?.type === "peer-unavailable") return;
      setErrorMessage(
        `Member error [${e?.type || "unknown"}]: ${e?.message || "Unknown error"}`,
      );
      setJoiningPeer(false);
    });
  }

  return (
    <Dialog>
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                className,
                inPeer
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
          <DialogDescription className="sr-only">
            Connect this browser to the in-game app to share live player
            positions across devices.
          </DialogDescription>
          <div className="text-xs text-muted-foreground">
            <Tooltip delayDuration={200} disableHoverableContent>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">What is this?</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[360px] space-y-2">
                <p>
                  <strong>The In-Game app is required</strong> to read player
                  positions from your game.
                </p>
                <p>
                  <strong>Peer Code:</strong> Enter the same code on all
                  teammate apps and browsers to connect them together
                  automatically. Generate a random code or create your own -
                  just make sure everyone uses the exact same code.
                </p>
                <p>
                  Live Mode shows real-time locations from the app. When off,
                  possible spawn locations are displayed. Your view follows your
                  selected player; teammates are shown but don't control the
                  map.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>
        <section className="space-y-2 overflow-hidden">
          {/* status and errors are shown via toasts */}

          <div className="space-y-2">
            <div className="grid w-full max-w-sm items-center gap-1.5" />

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <div className="flex justify-between">
                <Label htmlFor="peerCode">Peer Code</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="peerCode"
                  type="text"
                  value={peerCode}
                  onChange={(e) => setPeerCode(e.target.value)}
                  placeholder="Enter a shared Peer Code"
                  className="flex-1"
                  disabled={joiningPeer || inPeer}
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
              </div>
            </div>
            <Button
              type="button"
              className="w-full"
              variant={inPeer ? "destructive" : "default"}
              disabled={!peerCode || joiningPeer}
              onClick={() => (inPeer ? leavePeerMesh() : joinPeerMesh())}
            >
              {joiningPeer
                ? "Joining…"
                : inPeer
                  ? "Leave Peer Mesh"
                  : "Join Peer Mesh"}
            </Button>
            <div className="space-y-2">
              {!withoutLiveMode && (
                <div className="space-y-1.5 rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Live mode
                    </Label>
                    {/* Live mode needs a source: on the website that's a "Me"
                        sender. Disable the manual control when none is selected
                        (it would do nothing) or while Auto manages it. */}
                    <LiveModeControl
                      size="sm"
                      disabled={autoLiveModeWithMe || !meSenderId}
                    />
                  </div>
                  <Label className="flex items-center gap-1.5 text-xs h-auto cursor-pointer">
                    <Switch
                      checked={autoLiveModeWithMe}
                      onCheckedChange={setAutoLiveModeWithMe}
                      className="scale-75"
                    />
                    Auto Live Mode
                  </Label>
                  {!meSenderId && (
                    <p className="text-[11px] text-muted-foreground">
                      Select an app as “Me” below to use live mode.
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <Label>Apps ({peerSenderIds.length})</Label>
                <Label className="flex items-center gap-1.5 text-xs h-auto cursor-pointer">
                  <Switch
                    checked={showPeerLabels}
                    onCheckedChange={setShowPeerLabels}
                    className="scale-75"
                  />
                  Show names
                </Label>
              </div>
              <div className="relative">
                <ScrollArea className="h-40 rounded-md border p-2">
                  <div className="space-y-1">
                    {peerSenderIds.length > 0 ? (
                      <>
                        {!meSenderId && (
                          <p className="text-xs text-muted-foreground mb-2">
                            No player selected as "Me". All players shown as
                            teammates.
                          </p>
                        )}
                        {peerSenderIds.map((id) => (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-accent/50"
                          >
                            <span className="text-sm truncate flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  dataConnStatus[id] === "direct"
                                    ? "bg-green-400"
                                    : dataConnStatus[id] === "relay"
                                      ? "bg-blue-400"
                                      : dataConnStatus[id] === "failed"
                                        ? "bg-red-400"
                                        : "bg-yellow-400",
                                )}
                                title={
                                  dataConnStatus[id] === "direct"
                                    ? "Direct connection"
                                    : dataConnStatus[id] === "relay"
                                      ? "Relayed connection (TURN)"
                                      : dataConnStatus[id] === "failed"
                                        ? "Data connection failed"
                                        : "Connecting..."
                                }
                              />
                              {peerSenderNames[id] || id}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                meSenderId === id ? "default" : "outline"
                              }
                              onClick={() =>
                                setMeSenderId(meSenderId === id ? null : id)
                              }
                            >
                              {meSenderId === id ? "Selected" : "Set as Me"}
                            </Button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No apps yet.
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
                  direct
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  relay
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
            {inPeer && (
              <div className="rounded-md border p-2 bg-accent/5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span>
                    {receiverCount} browser
                    {receiverCount !== 1 ? "s" : ""} connected
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
