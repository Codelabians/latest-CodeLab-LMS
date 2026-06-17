import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  instructors: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const instructorsSlice = createSlice({
  name: "instructors",
  initialState,
  reducers: {
    getInstructors: (state, action) => {
      state.instructors = action.payload.instructors;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { getInstructors, setStatus, setError } = instructorsSlice.actions;

export const selectInstructorsStatus = (state) => state.instructors.status;
export const selectInstructorsError = (state) => state.instructors.error;
export default instructorsSlice.reducer;
