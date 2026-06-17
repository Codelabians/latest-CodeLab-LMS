import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  categories: [],
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter(
        (category) => category.uuid !== action.payload
      );
      state.categories = state.categories.map((category, index) => ({
        ...category,
        id: index + 1,
      }));
    },
    addCategory: (state, action) => {
      state.categories.push(action.payload);
    },
  },
});
export const { setCategories, deleteCategory, addCategory } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
