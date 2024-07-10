import { type DataConnection } from "peerjs";
import { create } from "zustand";
import { PrivateDrawing, PrivateNode } from "./settings";

export const useConnectionStore = create<{
  peerId: string;
  setPeerId: (peerId: string) => void;
  connections: Record<string, DataConnection>;
  addConnection: (conn: DataConnection) => void;
  closeExistingConnection: (peer: string) => void;
  closeExistingConnections: () => void;
  initializeConnection: (conn: DataConnection) => void;
  tempPrivateDrawing: Partial<PrivateDrawing> | null;
  setTempPrivateDrawing: (
    tempPrivateDrawing: Partial<PrivateDrawing> | null,
  ) => void;
  privateDrawings: PrivateDrawing[];
  setPrivateDrawings: (privateDrawings: PrivateDrawing[]) => void;
  tempPrivateNode: Partial<PrivateNode> | null;
  setTempPrivateNode: (tempPrivateNode: Partial<PrivateNode> | null) => void;
  privateNodes: PrivateNode[];
  setPrivateNodes: (privateNodes: PrivateNode[]) => void;
}>((set) => ({
  peerId: "",
  setPeerId: (peerId) => set({ peerId }),
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
  tempPrivateDrawing: null,
  setTempPrivateDrawing: (tempPrivateDrawing) => set({ tempPrivateDrawing }),
  privateDrawings: [],
  setPrivateDrawings: (privateDrawings) => set({ privateDrawings }),
  tempPrivateNode: null,
  setTempPrivateNode: (tempPrivateNode) => set({ tempPrivateNode }),
  privateNodes: [],
  setPrivateNodes: (privateNodes) => set({ privateNodes }),
}));
