import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import authReducer from "../features/auth/authSlice";
import errorReducer from "../features/error/errorSlice";
import coursesReducer from "../features/courses/coursesSlice";
import batchesReducer from "../features/batches/batchesSlice";
import categoriesReducer from "../features/categories/catogriesSlice";
import instructorsReducer from "../features/instructors/instructorsSlice";
import studentsReducer from "../features/students/studentsSlice";
import storage from "redux-persist/lib/storage";
import adminProfileReducer from "../features/adminProfile/adminProfileSlice";
import { persistReducer, persistStore } from "redux-persist";
import { thunk } from "redux-thunk";
import globalReducer from "../features/global/globalSlice";
// Define persist configurations for each slice
const authPersistConfig = {
  key: "auth",
  storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

// Combine reducers into a root reducer
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  categories: categoriesReducer,
  error: errorReducer,
  courses: coursesReducer,
  batches: batchesReducer,
  instructors: instructorsReducer,
  students: studentsReducer,
  adminProfile: adminProfileReducer,
  global: globalReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const persistConfig = {
  key: "root",
  storage,
  blacklist: [apiSlice.reducerPath], // do not persist API slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(apiSlice.middleware, thunk),
});

export const persistor = persistStore(store);
