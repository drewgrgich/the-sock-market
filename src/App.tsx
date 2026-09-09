import { useState } from "react"
import { setupGame, type GameState } from "./engine/index.ts"
import { SetupScreen } from "./ui/SetupScreen.tsx"
import { TableView } from "./ui/TableView.tsx"
import "./App.css"

function App() {
  const [state, setState] = useState<GameState | null>(null)

  if (!state) {
    return <SetupScreen onStart={(options) => setState(setupGame(options))} />
  }

  return <TableView state={state} onState={setState} onNewGame={() => setState(null)} />
}

export default App
