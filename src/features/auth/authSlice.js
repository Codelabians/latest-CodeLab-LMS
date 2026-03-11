import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../../api/apiSlice";
import { useEffect } from "react";
const initialState = {
  token: localStorage.getItem("token") || null, // Load token from localStorage if available
  user: null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token"); // Clear token from localStorage on logout
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(apiSlice.endpoints.post.matchFulfilled, (state, action) => {
        if (action.meta.arg.path === "/user/authentication/register") {
          state.token = action.payload.meta.token;
          state.user = action.payload.data;
          state.status = "succeeded";
        }
      })
      .addMatcher(apiSlice.endpoints.post.matchPending, (state, action) => {
        if (action.meta.arg.path === "/user/authentication/register") {
          state.status = "loading";
        }
      })
      .addMatcher(apiSlice.endpoints.post.matchRejected, (state, action) => {
        if (action.meta.arg.path === "/user/authentication/register") {
          state.status = "failed";
          state.error = action.error;
        }
      });
  },
});

export const { setCredentials, clearCredentials, setStatus, setError } =
  authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export default authSlice.reducer;
