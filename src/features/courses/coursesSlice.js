import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  courses: [],
  course: {},
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    getCourses: (state, action) => {
      state.courses = action.payload.courses;
    },
    getCourse: (state, action) => {
      state.course = action.payload.course;
    },

    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});
export const { getCourses, setStatus, setError, getCourse } =
  coursesSlice.actions;

export const selectCoursesStatus = (state) => state.courses.status;
export const selectCoursesError = (state) => state.courses.error;
export default coursesSlice.reducer;
