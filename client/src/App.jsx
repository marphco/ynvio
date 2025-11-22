import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import NewEvent from "./pages/NewEvent";
import EventPublic from "./pages/EventPublic";
import EventEditor from "./pages/EventEditor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/" element={<NewEvent />} />
      <Route path="/e/:slug" element={<EventPublic />} />
      <Route path="/edit/:slug" element={<EventEditor />} />
    </Routes>
  );
}

export default App;
