import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventPublic from "./pages/EventPublic";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/e/:slug" element={<EventPublic />} />
    </Routes>
  );
}

export default App;
