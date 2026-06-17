import { ToastContainer } from "react-toastify";
import Router from "./components/routes/Router";

function App() {
  return (
    <>
      <Router />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        // theme="colored"
        transition:Bounce
      />
    </>
  );
}

export default App;
