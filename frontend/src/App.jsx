import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./views/login/login";
import Home from "./views/home/home";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/home" element={<Home />} />

      </Routes>

    </BrowserRouter>
  );

}

export default App;