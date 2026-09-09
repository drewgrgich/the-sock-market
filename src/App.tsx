import { useState } from "react"
import { setupGame, type GameState } from "./engine/index.ts"
import { SetupScreen } from "./ui/SetupScreen.tsx"
import { TableView } from "./ui/TableView.tsx"
import { Tutorial } from "./ui/Tutorial.tsx"
import "./App.css"

function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [tutorial, setTutorial] = useState(true)

  if (!state) {
    if (tutorial) {
      return (
        <Tutorial onSkip={() => setTutorial(false)} onDone={() => setTutorial(false)} />
      )
    }
    return (
      <SetupScreen
        onStart={(options) => setState(setupGame(options))}
        onHowToPlay={() => setTutorial(true)}
      />
    )
  }

  return <TableView state={state} onState={setState} onNewGame={() => setState(null)} />
}

export default App
