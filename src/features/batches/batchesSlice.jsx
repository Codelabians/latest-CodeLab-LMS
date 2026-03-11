import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  batches: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const batchesSlice = createSlice({
  name: "batches",
  initialState,
  reducers: {
    getBatches: (state, action) => {
      state.batches = action.payload.batches;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { getBatches, setStatus, setError } = batchesSlice.actions;

export const selectBatchesStatus = (state) => state.batches.status;
export const selectBatchesError = (state) => state.batches.error;
export default batchesSlice.reducer;
