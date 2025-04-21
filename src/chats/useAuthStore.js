// src/components/chats/useAuthStore.js
import { create } from "zustand";

const useAuthStore = create((set) => ({
  token: null,
  user: null, // Store user data received after validation
  isAuthenticated: false,
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}));

export default useAuthStore;
