import { useState } from "react";
import "./App.css";
import ViewComponent from "./components/ViewComponent";
import UploadComponent from "./components/UploadComponent";

function App() {
  const parts = {
    view: <ViewComponent />,
    upload: <UploadComponent />,
  };

  const [mode, setMode] = useState("view");

  return (
    <div className="w-full min-h-screen pt-8 bg-slate-900">
      {parts[mode]}
      <div className="flex gap-2 p-2 bg-slate-700 max-w-[300px] rounded-md font-semibold shadow-md mx-auto text-center relative">
        <div
          className={`bg-slate-600 absolute h-8 w-[calc(50%_-_8px)] rounded-md transition-all duration-150 ease-in-out ${
            mode === "upload" ? "translate-x-full" : "translate-x-0"
          }`}
        ></div>
        <p
          className="relative px-2 py-1 text-white rounded-md cursor-pointer basis-1/2"
          onClick={() => setMode("view")}
        >
          View
        </p>
        <p
          className="relative px-2 py-1 text-white rounded-md cursor-pointer basis-1/2"
          onClick={() => setMode("upload")}
        >
          Upload
        </p>
      </div>
    </div>
  );
}

export default App;
