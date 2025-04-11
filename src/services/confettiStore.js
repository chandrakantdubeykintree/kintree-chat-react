import { create } from "zustand";

export const useConfettiStore = create((set) => ({
  isOpen: false,
  points: null,
  duration: 3000,
  openConfetti: (points) => set({ isOpen: true, points: points }),
  closeConfetti: () => set({ isOpen: false, points: null }),
}));
