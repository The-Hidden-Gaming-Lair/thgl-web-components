import type { DataConnection } from "peerjs";
import Peer from "peerjs";

// Common types for peer mesh communication
export type ControlMsg =
  | { type: "hello"; role: "sender" | "receiver"; id: string; name?: string }
  | { type: "peer-list"; senders: string[]; names?: Record<string, string> }
  | {
      type: "peer-joined";
      role: "sender" | "receiver";
      id: string;
      name?: string;
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
    const peer = new Peer();

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
}
