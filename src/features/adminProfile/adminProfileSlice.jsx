import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  adminProfile: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const adminProfileSlice = createSlice({
  name: "adminProfile",
  initialState,
  reducers: {
    getAdminProfile: (state, action) => {
      state.adminProfile = action.payload.adminProfile;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { getAdminProfile, setStatus, setError } =
  adminProfileSlice.actions;

export const selectAdminProfileStatus = (state) => state.adminProfile.status;
export const selectAdminProfileError = (state) => state.adminProfile.error;
export default adminProfileSlice.reducer;
