import { createSlice } from "@reduxjs/toolkit";

// Session-only lock for the Finance area. Deliberately NOT persisted
// (see store.js persistConfig blacklist) — a full page refresh re-locks,
// while in-app navigation between finance pages stays unlocked.
const financeGateSlice = createSlice({
  name: "financeGate",
  initialState: {
    unlocked: false,
    unlockedAt: null, // ms epoch — used for the 10-minute auto-relock
  },
  reducers: {
    unlockFinance: (state) => {
      state.unlocked = true;
      state.unlockedAt = Date.now();
    },
    lockFinance: (state) => {
      state.unlocked = false;
      state.unlockedAt = null;
    },
  },
});

export const { unlockFinance, lockFinance } = financeGateSlice.actions;
export const selectFinanceUnlocked = (state) => state.financeGate?.unlocked;
export const selectFinanceUnlockedAt = (state) => state.financeGate?.unlockedAt;
export default financeGateSlice.reducer;
