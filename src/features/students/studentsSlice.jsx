import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  students: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  challans: {}, // Store challans by studentId
};

const studentsSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    getStudents: (state, action) => {
      state.students = action.payload.students;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addStudentChallan: (state, action) => {
      const { studentId, pdfUrl } = action.payload;
      state.challans[studentId] = { pdfUrl };
    },
  },
});

export const { getStudents, setStatus, setError, addStudentChallan } =
  studentsSlice.actions;

export const selectStudentsStatus = (state) => state.students.status;
export const selectStudentsError = (state) => state.students.error;
export const selectStudentChallan = (state, studentId) =>
  state.students.challans[studentId];
export default studentsSlice.reducer;
