import type { DataConnection } from "peerjs";
import Peer from "peerjs";

// Common types for peer mesh communication
export type ControlMsg =
  | { type: "hello"; role: "sender" | "receiver"; id: string; name?: string }
  | {
      type: "peer-list";
      senders: string[];
      names?: Record<string, string>;
      receiverCount?: number;
    }
  | {
      type: "peer-joined";
      role: "sender" | "receiver";
      id?: string;
      name?: string;
      receiverCount?: number;
    }
  | { type: "peer-left"; id: string }
  | { type: "set-me"; senderId: string; receiverId?: string } // Receiver tells sender they selected it as "Me"
  | { type: "unset-me"; senderId: string; receiverId?: string }; // Receiver tells sender they unselected it as "Me"

// Common peer mesh state
export interface PeerMeshState {
  inPeer: boolean;
  joiningPeer: boolean;
  peerSenderIds: string[];
  peerSenderNames: Record<string, string>;
  errorMessage: string;
}

// ICE server configuration for WebRTC NAT traversal
const iceServers: RTCIceServer[] = [
  { urls: "stun:turn.th.gl:3478" },
  {
    urls: "turn:turn.th.gl:3478",
    username: "thgl",
    credential: "thgl-turn-Kx9mP4vR7nQ2wE8j",
  },
  {
    urls: "turn:turn.th.gl:3478?transport=tcp",
    username: "thgl",
    credential: "thgl-turn-Kx9mP4vR7nQ2wE8j",
  },
  {
    urls: "turns:turn.th.gl:5349?transport=tcp",
    username: "thgl",
    credential: "thgl-turn-Kx9mP4vR7nQ2wE8j",
  },
];

export const peerConfig: RTCConfiguration = { iceServers };

// Self-hosted PeerJS signaling broker (peer.th.gl on the coturn box) instead of
// the free public PeerJS cloud (0.peerjs.com), which is rate-limited and goes
// down for hours at a time — the cause of intermittent "can't connect to peer
// mesh" reports. Pass this to every `new Peer(...)` so the handshake uses our
// broker; media/data still flow over the self-hosted TURN in `config`.
export const peerServerOptions = {
  host: "peer.th.gl",
  port: 443,
  secure: true,
  path: "/",
  key: "thgl",
  config: peerConfig,
};

// Utility functions for peer mesh operations
export class PeerMeshUtils {
  static createRootId(domain: string, peerCode: string): string {
    return `${domain}-th-gl-peer-${peerCode}`;
  }

  static createRandomWord(alphabet: string, length: number): string {
    let result = "";
    const alphabetLength = alphabet.length;
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * alphabetLength);
      result += alphabet[randomIndex];
    }
    return result;
  }

  static setupJoinTimeout(
    timeoutMs: number,
    onTimeout: () => void,
  ): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }

  static createDataPeer(
    onOpen?: () => void,
    onError?: (error: any) => void,
    onClose?: () => void,
    onConnection?: (conn: DataConnection) => void,
  ): Peer {
    const peer = new Peer(peerServerOptions);

    if (onOpen) {
      peer.on("open", onOpen);
    }

    if (onError) {
      peer.on("error", onError);
    }

    if (onClose) {
      peer.on("close", onClose);
    }

    if (onConnection) {
      peer.on("connection", onConnection);
    }

    peer.on("disconnected", () => {
      // Basic reconnection logic can be added here if needed
    });

    return peer;
  }

  static initializeDataConnection(
    conn: DataConnection,
    onData?: (data: any) => void,
    onClose?: () => void,
    onError?: () => void,
  ): void {
    if (onData) {
      conn.on("data", (data) => {
        if (typeof data === "object" && data !== null) {
          onData(data);
        }
      });
    }

    if (onClose) {
      conn.on("close", onClose);
    }

    if (onError) {
      conn.on("error", onError);
    }
  }

  static cleanupConnections(connections: Record<string, DataConnection>): void {
    Object.values(connections).forEach((conn) => {
      try {
        conn.removeAllListeners();
        conn.close();
      } catch {
        // Ignore errors during cleanup
      }
    });
  }

  static updateSenderList(newIds: string[], selfId?: string): string[] {
    return newIds.filter((id) => id !== selfId);
  }

  static addSenderToList(
    currentIds: string[],
    newId: string,
    selfId?: string,
  ): string[] {
    if (currentIds.includes(newId) || newId === selfId) {
      return currentIds;
    }
    return [...currentIds, newId];
  }

  static removeSenderFromList(
    currentIds: string[],
    removeId: string,
  ): string[] {
    return currentIds.filter((id) => id !== removeId);
  }

  static updateSenderNames(
    currentNames: Record<string, string>,
    senderId: string,
    senderName?: string,
  ): Record<string, string> {
    if (senderName) {
      return { ...currentNames, [senderId]: senderName };
    }
    return currentNames;
  }

  static removeSenderName(
    currentNames: Record<string, string>,
    senderId: string,
  ): Record<string, string> {
    const updated = { ...currentNames };
    delete updated[senderId];
    return updated;
  }

  /**
   * Evict a stale sender that has the same name as a newly joining sender.
   * This handles the case where a sender restarts and gets a new data peer ID.
   * `protectedId` (the leader's own sender ID) is never evicted — the leader
   * is provably alive while processing the join, so a same-name joiner is a
   * second live session, not a stale ghost.
   * Returns the evicted sender ID if found, or null.
   */
  static evictStaleSenderByName(
    senderIds: Set<string>,
    senderNames: Record<string, string>,
    senderConnMap: Map<string, string>,
    newId: string,
    newName?: string,
    protectedId?: string,
  ): string | null {
    if (!newName) return null;
    for (const [existingId, existingName] of Object.entries(senderNames)) {
      if (
        existingName === newName &&
        existingId !== newId &&
        existingId !== protectedId
      ) {
        senderIds.delete(existingId);
        delete senderNames[existingId];
        for (const [connPeer, senderId] of senderConnMap.entries()) {
          if (senderId === existingId) {
            senderConnMap.delete(connPeer);
            break;
          }
        }
        return existingId;
      }
    }
    return null;
  }
}
