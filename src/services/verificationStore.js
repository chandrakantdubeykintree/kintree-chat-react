import { create } from "zustand";

export const useVerificationStore = create((set) => ({
  isVerified: false,
  verificationTimestamp: null,
  setVerified: (status) =>
    set({
      isVerified: status,
      verificationTimestamp: status ? Date.now() : null,
    }),
}));
