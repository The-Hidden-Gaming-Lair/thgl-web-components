"use client";

import { cn, useGameState, useSettingsStore } from "@repo/lib";
import type { ActorPlayer, Actor } from "@repo/lib/overwolf";
import Peer, { DataConnection } from "peerjs";
import { RemotePlayer, usePeersStore } from "../(providers)/peers-store";
import { PeerMeshUtils, type ControlMsg } from "../(providers)/peer-mesh-utils";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Cast, Copy, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ScrollArea, Switch } from "../(controls)";

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
  const manualDisconnectRef = useRef(false);
  const leavingTeamRef = useRef(false);

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
    console.log("Me sender changed", meSenderId);
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

  // Automatic Live Mode control based on Me selection and AutoLiveMode setting
  useEffect(() => {
    if (withoutLiveMode) return; // Don't control Live Mode if disabled

    const shouldBeLive = Boolean(inPeer && meSenderId && autoLiveModeWithMe);
    setLiveMode(shouldBeLive);
  }, [inPeer, meSenderId, autoLiveModeWithMe, withoutLiveMode, setLiveMode]);

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

    // Set a timeout for the connection to open
    const connectionTimeout = setTimeout(() => {
      if (!conn.open) {
        console.log("Connection timeout for", peerId);
        conn.removeAllListeners();
        conn.close();
        delete connectionsRef.current[peerId];
      }
    }, 10000); // 10 second timeout

    conn.on("open", () => {
      clearTimeout(connectionTimeout);
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
    });
    conn.on("error", (error) => {
      clearTimeout(connectionTimeout);
      console.log("Data connection error for", peerId, error);
      delete connectionsRef.current[peerId];
      delete lastDataRef.current[peerId];
      peersStoreRemove(peerId);
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
      peerRef.current = new PeerJs();
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
        console.log("peer error", error, error.name, error.message);
        // Handle specific error types as per PeerJS API
        switch (error.type) {
          case "peer-unavailable":
            setErrorMessage("Peer is not available");
            break;
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
    const joinTimeout = setTimeout(() => {
      setJoiningPeer(false);
      setErrorMessage("Failed to join peer mesh - connection timeout");
      if (controlPeerRef.current) {
        try {
          controlPeerRef.current.destroy();
        } catch {}
        controlPeerRef.current = null;
      }
    }, 5000);

    const rootId = PeerMeshUtils.createRootId(domain, peerCode);
    // Ensure our data peer has an ID before joining, so we can announce to the leader
    ensurePeerReady(() => {
      // Prefer joining as member first; if no leader exists, we'll promote to leader.
      becomePeerMember(rootId, joinTimeout);
    });
  }

  function becomePeerMember(
    rootId: string,
    joinTimeout?: ReturnType<typeof setTimeout>,
  ) {
    const memberPeer = new Peer();
    controlPeerRef.current = memberPeer;
    memberPeer.on("open", () => {
      const conn = memberPeer.connect(rootId);
      controlConnectionRef.current = conn;
      let promoteTimer: ReturnType<typeof setTimeout> | null = setTimeout(
        () => {
          // If no leader responds in time, become coordinator
          try {
            const leaderPeer = new Peer(rootId);
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
                    } as ControlMsg);
                  }
                }
              });
              conn.on("close", () => {
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
                }
              });
            });
            leaderPeer.on("open", () => {
              setErrorMessage("");
              setInPeer(true);
              // Keep joiningPeer as true since we're still setting up
              setPeerSenderIds(Array.from(senderIds));
              // Only set joiningPeer to false after setup is complete
              setTimeout(() => setJoiningPeer(false), 100);
              if (joinTimeout) clearTimeout(joinTimeout);
            });
            leaderPeer.on("error", (err: any) => {
              if (err?.type === "unavailable-id") {
                setJoiningPeer(true);
                becomePeerMember(rootId);
              } else {
                setErrorMessage(err?.message || "Peer Mesh error");
                setJoiningPeer(false);
              }
            });
          } catch (err: any) {
            setErrorMessage(err?.message || "Peer Mesh error");
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
            const leaderPeer = new Peer(rootId);
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
                    } as ControlMsg);
                  }
                }
              });
              conn.on("close", () => {
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
                }
              });
            });
            leaderPeer.on("open", () => {
              setErrorMessage("");
              setInPeer(true);
              // Keep joiningPeer as true since we're still setting up
              setPeerSenderIds(Array.from(senderIds));
              // Only set joiningPeer to false after setup is complete
              setTimeout(() => setJoiningPeer(false), 100);
              if (joinTimeout) clearTimeout(joinTimeout);
            });
            leaderPeer.on("error", (err: any) => {
              if (err?.type === "unavailable-id") {
                // Another leader appeared; try member again
                setJoiningPeer(true);
                becomePeerMember(rootId);
              } else {
                setErrorMessage(err?.message || "Peer Mesh error");
                setJoiningPeer(false);
              }
            });
          } catch (err: any) {
            setErrorMessage(err?.message || "Peer Mesh error");
            setJoiningPeer(false);
          }
        } else {
          setErrorMessage(e?.message || "Peer Mesh error");
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
          const leaderPeer = new Peer(rootId);
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
                  } as ControlMsg);
                }
              }
            });
            conn.on("close", () => {
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
                }
              }
            });
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
              setErrorMessage(err?.message || "Peer Mesh error");
              setJoiningPeer(false);
            }
          });
        } catch (err: any) {
          setErrorMessage(err?.message || "Peer Mesh error");
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
        } else if (msg.type === "peer-joined" && msg.role === "sender") {
          setPeerSenderIds((prev) =>
            PeerMeshUtils.addSenderToList(prev, msg.id),
          );
          setPeerSenderNames((prev) =>
            PeerMeshUtils.updateSenderNames(prev, msg.id, (msg as any).name),
          );
          if (!connectionsRef.current[msg.id]) {
            ensurePeerReady(() => {
              if (!peerRef.current || connectionsRef.current[msg.id]) return;
              const c = peerRef.current.connect(msg.id);
              initializeDataConnection(c);
            });
          }
        } else if (msg.type === "peer-left") {
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
          }
        }
      });
    });
    memberPeer.on("error", (e) => {
      setErrorMessage(e?.message || "Peer Mesh error");
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
              <div className="flex items-center justify-between">
                <Label>Apps ({peerSenderIds.length})</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {!withoutLiveMode && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        Live Mode: {liveMode ? "On" : "Off"}
                      </span>
                      <Label className="flex items-center gap-1 text-xs h-auto cursor-pointer">
                        <Switch
                          checked={autoLiveModeWithMe}
                          onCheckedChange={setAutoLiveModeWithMe}
                          className="scale-75"
                        />
                        Auto Live Mode
                      </Label>
                    </>
                  )}
                </div>
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
                            <span className="text-sm truncate">
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
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
