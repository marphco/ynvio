import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventPublic from "./pages/EventPublic";
import EventEditor from "./pages/EventEditor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/e/:slug" element={<EventPublic />} />
      <Route path="/edit/:slug" element={<EventEditor />} />
    </Routes>
  );
}

export default App;
