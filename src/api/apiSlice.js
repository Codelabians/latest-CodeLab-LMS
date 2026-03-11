import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearCredentials } from "../features/auth/authSlice";

// const REACT_APP_API_URL = "https://api-rohi.codelab.pk/public/api";
// const REACT_APP_API_URL = "https://test-rohi-backend.codelab.pk/public/api/";

// const REACT_APP_API_URL = "https://dev-rohi-backend.codelab.pk/public/api";
const REACT_APP_API_URL = "http://192.168.1.21:8000/api";

const API_URL = REACT_APP_API_URL;

// Helper function to download blob
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Don't set Accept header here for flexibility
    return headers;
  },
});
// const baseQuery = fetchBaseQuery({
//   baseUrl: API_URL,
//   prepareHeaders: (headers, { getState }) => {
//     // 1. Set global headers
//     headers.set("Accept", "application/json");

//     // 2. Set the token (Hardcoded for your test)
//     headers.set(
//       "Authorization",
//       "Bearer 860|a8nG0QrT755gv6Gpmnzhu2H2RYGZwgDdEWVekrYZ642e2ec8"
//     );

//     return headers;
//   },
// });
// const baseQuery = fetchBaseQuery({
//   baseUrl: API_URL,
//   prepareHeaders: (headers, { getState }) => {
//     headers.set("Accept", "application/json");

//     const token = getState().auth?.token;

//     if (token) {
//       headers.set("Authorization", `Bearer ${token}`);
//     }

//     return headers;
//   },
// });

// const baseQueryWithReauth = async (args, api, extraOptions) => {
//   let result = await baseQuery(args, api, extraOptions);
//   const contentType = result.meta?.response?.headers.get("content-type");

//   if (contentType && contentType.includes("application/json")) {
//     return result;
//   } else if (
//     contentType?.includes("application/octet-stream") ||
//     contentType?.includes("application/pdf")
//   ) {
//     return { data: result.meta.response };
//   } else {
//     throw new Error("Unexpected content type received.");
//   }
// };
// Base query with 401 → logout + redirect
const baseQueryWithReauthAndRedirect = async (args, api, extraOptions) => {
  // original request
  let result = await baseQuery(args, api, extraOptions);

  // ---------- 401 detection ----------
  const is401 =
    result.error?.status === 401 || result.meta?.response?.status === 401;

  if (is401) {
    // 1. Clear auth state
    api.dispatch(clearCredentials());

    // 2. Navigate to /signin
    //   - If we are inside a hook that provides `extraOptions.navigate`
    //   - Otherwise fall back to history API
    const navigate = extraOptions?.navigate;
    if (typeof navigate === "function") {
      navigate("/signin", { replace: true });
    } else {
      history.replace("/signin");
    }
  }

  // Preserve the original blob handling you already have
  const contentType = result.meta?.response?.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return result;
  } else if (
    contentType?.includes("application/octet-stream") ||
    contentType?.includes("application/pdf")
  ) {
    return { data: result.meta.response };
  } else {
    throw new Error("Unexpected content type received.");
  }
};
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauthAndRedirect,
  tagTypes: ["KeyName"],
  endpoints: (builder) => ({
    get: builder.query({
      query: ({ path, params }) => ({
        url: path,
        method: "GET",
        params,
        headers: {
          Accept: "application/json",
        },
      }),
      providesTags: (result, error, { path }) =>
        result ? [{ type: "KeyName", id: path }] : ["KeyName"],
      transformResponse: async (response, meta) => {
        const contentType = meta.response.headers.get("content-type");
        if (contentType?.includes("application/octet-stream")) {
          return;
        } else if (contentType?.includes("application/json")) {
          return response;
        } else {
          throw new Error("Unexpected content type received");
        }
      },
    }),

    // post: builder.mutation({
    //   // query: ({ path, body }) => ({
    //   //   url: path,
    //   //   method: "POST",
    //   //   body,
    //   //   headers: {
    //   //     Accept: "application/json",
    //   //   },
    //   // }),
    //   query: ({ path, body }) => ({
    //     url: path,
    //     method: "POST",
    //     body,
    //   }),

    //   invalidatesTags: ["KeyName"],
    // }),
    // post: builder.mutation({
    //   query: ({ path, body }) => ({
    //     url: path,
    //     method: "POST",
    //     body,
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json",
    //     },
    //   }),
    //   invalidatesTags: ["KeyName"],
    // }),
    post: builder.mutation({
      query: ({ path, body }) => {
        const isFormData = body instanceof FormData;

        return {
          url: path,
          method: "POST",
          body,
          ...(isFormData
            ? {} // ❗ DO NOT set headers for FormData
            : {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              }),
        };
      },
      invalidatesTags: ["KeyName"],
    }),

    smartPost: builder.mutation({
      queryFn: async ({ path, body, filename }, api) => {
        try {
          const token = api.getState().auth?.token;

          const isFormData = body instanceof FormData;

          const response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: {
              Accept:
                "application/json, application/pdf, application/octet-stream",
              ...(token && { Authorization: `Bearer ${token}` }),
              // ❌ DO NOT set Content-Type for FormData
              ...(isFormData ? {} : { "Content-Type": "application/json" }),
            },
            body: isFormData ? body : JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errorData,
              },
            };
          }

          const contentType = response.headers.get("content-type");

          // ✅ PDF / FILE RESPONSE
          if (
            contentType?.includes("application/pdf") ||
            contentType?.includes("application/octet-stream")
          ) {
            const blob = await response.blob();

            const contentDisposition = response.headers.get(
              "content-disposition",
            );

            let finalFilename = filename || "document.pdf";

            if (contentDisposition) {
              const match = contentDisposition.match(
                /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
              );
              if (match && match[1]) {
                finalFilename = match[1].replace(/['"]/g, "");
              }
            }

            downloadBlob(blob, finalFilename);

            return {
              data: {
                isFile: true,
                filename: finalFilename,
              },
            };
          }

          // ✅ JSON RESPONSE
          const json = await response.json();
          return {
            data: {
              isFile: false,
              ...json,
            },
          };
        } catch (error) {
          return {
            error: {
              status: "FETCH_ERROR",
              error: error.message,
            },
          };
        }
      },
      invalidatesTags: ["KeyName"],
    }),

    // PDF Download endpoint
    // PDF Download endpoint
    postWithPdfDownload: builder.mutation({
      queryFn: async ({ path, body, filename }, api) => {
        try {
          const state = api.getState();
          const token = state.auth?.token;

          const response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/pdf, application/octet-stream",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errorData,
              },
            };
          }

          const contentType = response.headers.get("content-type");

          if (
            contentType?.includes("application/pdf") ||
            contentType?.includes("application/octet-stream")
          ) {
            const blob = await response.blob();

            const contentDisposition = response.headers.get(
              "content-disposition",
            );
            let finalFilename = filename || "challan.pdf";

            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
              );
              if (filenameMatch && filenameMatch[1]) {
                finalFilename = filenameMatch[1].replace(/['"]/g, "");
              }
            }

            downloadBlob(blob, finalFilename);

            return {
              data: {
                success: true,
                filename: finalFilename,
                message: "PDF downloaded successfully",
              },
            };
          } else {
            const jsonData = await response.json();
            return { data: jsonData };
          }
        } catch (error) {
          console.error("PDF Download Error:", error);
          return {
            error: {
              status: "FETCH_ERROR",
              error: error.message,
            },
          };
        }
      },
      invalidatesTags: ["KeyName"],
    }),

    // Challan Download endpoint - GET method only
    downloadChallan: builder.mutation({
      queryFn: async ({ path, params, filename }, api) => {
        try {
          const state = api.getState();
          const token = state.auth?.token;

          // Build query string from params
          const queryString = params
            ? "?" +
              Object.keys(params)
                .map(
                  (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                      params[key],
                    )}`,
                )
                .join("&")
            : "";

          const response = await fetch(`${API_URL}${path}${queryString}`, {
            method: "GET",
            headers: {
              Accept: "application/pdf, application/octet-stream",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errorData,
              },
            };
          }

          const contentType = response.headers.get("content-type");

          if (
            contentType?.includes("application/pdf") ||
            contentType?.includes("application/octet-stream")
          ) {
            const blob = await response.blob();

            const contentDisposition = response.headers.get(
              "content-disposition",
            );
            let finalFilename = filename || "challan.pdf";

            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
              );
              if (filenameMatch && filenameMatch[1]) {
                finalFilename = filenameMatch[1].replace(/['"]/g, "");
              }
            }

            downloadBlob(blob, finalFilename);

            return {
              data: {
                success: true,
                filename: finalFilename,
                message: "Challan downloaded successfully",
              },
            };
          } else {
            const jsonData = await response.json();
            return { data: jsonData };
          }
        } catch (error) {
          console.error("Challan Download Error:", error);
          return {
            error: {
              status: "FETCH_ERROR",
              error: error.message,
            },
          };
        }
      },
    }),

    put: builder.mutation({
      query: ({ path, body }) => ({
        url: path,
        method: "PUT",
        body,
        headers: {
          Accept: "application/json",
        },
      }),
      invalidatesTags: ["KeyName"],
    }),

    delete: builder.mutation({
      query: ({ path }) => ({
        url: path,
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      }),
      invalidatesTags: ["KeyName"],
    }),

    patch: builder.mutation({
      query: ({ path, body }) => ({
        url: path,
        method: "PATCH",
        body,
        headers: {
          Accept: "application/json",
        },
      }),
      invalidatesTags: ["KeyName"],
    }),
  }),
});

export const {
  useGetQuery,
  usePostMutation,
  usePostWithPdfDownloadMutation,
  usePutMutation,
  useDeleteMutation,
  useSmartPostMutation,
  usePatchMutation,
  useUploadChallanMutation,
  useDownloadChallanMutation,
} = apiSlice;

export default apiSlice.reducer;
// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { clearCredentials } from "../features/auth/authSlice";

// // const API_URL = "https://api-rohi.codelab.pk/public/api";
// // const API_URL  = "https://test-rohi-backend.codelab.pk/public/api/";

// // const API_URL  = "https://dev-rohi-backend.codelab.pk/public/api";
// const API_URL = "http://192.168.1.32:8000/api";
// /* =======================
//    Helper: Download Blob
// ======================= */
// const downloadBlob = (blob, filename) => {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   window.URL.revokeObjectURL(url);
// };

// /* =======================
//    Base Query
// ======================= */
// const baseQuery = fetchBaseQuery({
//   baseUrl: API_URL,
//   prepareHeaders: (headers, { getState }) => {
//     headers.set("Accept", "application/json");

//     const token = getState().auth?.token;
//     if (token) {
//       headers.set("Authorization", `Bearer ${token}`);
//     }
//     return headers;
//   },
// });

// /* =======================
//    Base Query with 401 Handling
// ======================= */
// const baseQueryWithReauth = async (args, api, extraOptions) => {
//   const result = await baseQuery(args, api, extraOptions);

//   if (result?.error?.status === 401) {
//     api.dispatch(clearCredentials());
//     window.location.replace("/signin");
//   }

//   return result;
// };

// /* =======================
//    API Slice
// ======================= */
// export const apiSlice = createApi({
//   reducerPath: "api",
//   baseQuery: baseQueryWithReauth,
//   tagTypes: ["KeyName"],
//   endpoints: (builder) => ({
//     /* ---------- GET ---------- */
//     get: builder.query({
//       query: ({ path, params }) => ({
//         url: path,
//         method: "GET",
//         params,
//       }),
//       providesTags: (result, error, { path }) => [
//         { type: "KeyName", id: path },
//       ],
//     }),

//     /* ---------- POST ---------- */
//     post: builder.mutation({
//       query: ({ path, body }) => ({
//         url: path,
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: ["KeyName"],
//     }),

//     /* ---------- PUT ---------- */
//     put: builder.mutation({
//       query: ({ path, body }) => ({
//         url: path,
//         method: "PUT",
//         body,
//       }),
//       invalidatesTags: ["KeyName"],
//     }),

//     /* ---------- PATCH ---------- */
//     patch: builder.mutation({
//       query: ({ path, body }) => ({
//         url: path,
//         method: "PATCH",
//         body,
//       }),
//       invalidatesTags: ["KeyName"],
//     }),

//     /* ---------- DELETE ---------- */
//     delete: builder.mutation({
//       query: ({ path }) => ({
//         url: path,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["KeyName"],
//     }),

//     /* ---------- POST + PDF DOWNLOAD ---------- */
//     postWithPdfDownload: builder.mutation({
//       queryFn: async ({ path, body, filename }, api) => {
//         try {
//           const token = api.getState().auth?.token;

//           const res = await fetch(`${API_URL}${path}`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Accept: "application/pdf, application/octet-stream",
//               ...(token && { Authorization: `Bearer ${token}` }),
//             },
//             body: JSON.stringify(body),
//           });

//           if (!res.ok) {
//             return { error: { status: res.status } };
//           }

//           const blob = await res.blob();
//           downloadBlob(blob, filename || "document.pdf");

//           return { data: { success: true } };
//         } catch (error) {
//           return { error: { status: "FETCH_ERROR", error: error.message } };
//         }
//       },
//     }),

//     /* ---------- GET + PDF DOWNLOAD ---------- */
//     downloadChallan: builder.mutation({
//       queryFn: async ({ path, params, filename }, api) => {
//         try {
//           const token = api.getState().auth?.token;

//           const qs = params ? "?" + new URLSearchParams(params).toString() : "";

//           const res = await fetch(`${API_URL}${path}${qs}`, {
//             method: "GET",
//             headers: {
//               Accept: "application/pdf, application/octet-stream",
//               ...(token && { Authorization: `Bearer ${token}` }),
//             },
//           });

//           if (!res.ok) {
//             return { error: { status: res.status } };
//           }

//           const blob = await res.blob();
//           downloadBlob(blob, filename || "challan.pdf");

//           return { data: { success: true } };
//         } catch (error) {
//           return { error: { status: "FETCH_ERROR", error: error.message } };
//         }
//       },
//     }),
//   }),
// });

// /* =======================
//    Hooks Export
// ======================= */
// export const {
//   useGetQuery,
//   usePostMutation,
//   usePutMutation,
//   usePatchMutation,
//   useDeleteMutation,
//   usePostWithPdfDownloadMutation,
//   useDownloadChallanMutation,
// } = apiSlice;

// export default apiSlice.reducer;
