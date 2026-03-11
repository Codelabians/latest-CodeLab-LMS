import { createSlice } from "@reduxjs/toolkit";

const errorSlice = createSlice({
  name: "error",
  initialState: {
    warning: null,
    error: null,
    isValidSession: true,
  },
  reducers: {
    setWarning: (state, action) => {
      state.warning = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setValidSession: (state, action) => {
      state.isValidSession = action.payload;
    },
  },
});

export const { setWarning, setError, setValidSession } = errorSlice.actions;

export default errorSlice.reducer;
