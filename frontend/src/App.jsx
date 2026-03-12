import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar        from "./assets/navbar/navbar";
import Login         from "./views/login/login";
import Home          from "./views/home/home";
import Historico     from "./views/historico/historico";
import Investimentos from "./views/investimentos/investimentos";

// Layout que exibe a navbar apenas em páginas autenticadas
function Layout() {
  const { pathname } = useLocation();
  const semNavbar    = ["/"];           // rotas sem navbar (login)
  const exibeNavbar  = !semNavbar.includes(pathname);

  return (
    <>
      {exibeNavbar && <Navbar />}
      <Routes>
        <Route path="/"              element={<Login />} />
        <Route path="/home"          element={<Home />} />
        <Route path="/historico"     element={<Historico />} />
        <Route path="/investimentos" element={<Investimentos />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;