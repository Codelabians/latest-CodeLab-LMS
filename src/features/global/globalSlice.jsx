import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categoryId: null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const globalSLice = createSlice({
  name: "global",
  initialState,
  reducers: {
    getGlobalState: (state, action) => {
      state.categoryId = action.payload.categoryId;
    },
    clearId: (state, action) => {
      state.categoryId = null;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { getGlobalState, clearId, setStatus, setError } =
  globalSLice.actions;

export const selectGlobalStatus = (state) => state.global.status;
export const selectGlobalError = (state) => state.global.error;
export const selectGlobalCategoryId = (state) => state.global.categoryId;
export default globalSLice.reducer;
