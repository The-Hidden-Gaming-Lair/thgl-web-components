import { create } from "zustand";
import type { ActorPlayer, Actor } from "@repo/lib/overwolf";

// Extended player type that includes id and name from remote peers
export type RemotePlayer = ActorPlayer & {
  id: string;
  name: string;
};

type PeersState = {
  remotePlayers: Record<string, RemotePlayer>;
  remoteActors: Record<string, Actor[]>;
  setRemotePlayer: (peerId: string, player: RemotePlayer) => void;
  setRemoteActors: (peerId: string, actors: Actor[]) => void;
  removePeer: (peerId: string) => void;
  clear: () => void;
};

export const usePeersStore = create<PeersState>((set) => ({
  remotePlayers: {},
  remoteActors: {},
  setRemotePlayer: (peerId, player) =>
    set((state) => ({
      remotePlayers: { ...state.remotePlayers, [peerId]: player },
    })),
  setRemoteActors: (peerId, actors) =>
    set((state) => ({
      remoteActors: { ...state.remoteActors, [peerId]: actors },
    })),
  removePeer: (peerId) =>
    set((state) => {
      const nextPlayers = { ...state.remotePlayers };
      const nextActors = { ...state.remoteActors };
      delete nextPlayers[peerId];
      delete nextActors[peerId];
      return { remotePlayers: nextPlayers, remoteActors: nextActors };
    }),
  clear: () => set({ remotePlayers: {}, remoteActors: {} }),
}));
