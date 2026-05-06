import "./lib/chain"; // initialise createAppKit before any React renders
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
