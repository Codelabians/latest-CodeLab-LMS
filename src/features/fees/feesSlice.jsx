import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fees: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const feesSlice = createSlice({
  name: "fees",
  initialState,
  reducers: {
    getFees: (state, action) => {
      state.students = action.payload.fees;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { getFees, setStatus, setError } = feesSlice.actions;

export const selectFeesStatus = (state) => state.fees.status;
export const selectFeesError = (state) => state.fees.error;
export default feesSlice.reducer;
