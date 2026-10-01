import { useEffect } from "react";
import { getDb } from "./lib/db";

function App() {
  useEffect(() => {
    void getDb().catch((err) => console.error("[db] init failed", err));
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">brunopad</h1>
    </div>
  );
}

export default App;
