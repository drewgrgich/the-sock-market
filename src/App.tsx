import { useState } from "react"
import { setupGame, type GameState } from "./engine/index.ts"
import { SetupScreen } from "./ui/SetupScreen.tsx"
import { TableView } from "./ui/TableView.tsx"
import { Tutorial } from "./ui/Tutorial.tsx"
import "./App.css"

function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [tutorial, setTutorial] = useState(true)
  const [coach, setCoach] = useState(true)
  const [watchTurns, setWatchTurns] = useState(true)

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
        coach={coach}
        onCoach={setCoach}
        watchTurns={watchTurns}
        onWatchTurns={setWatchTurns}
      />
    )
  }

  return (
    <TableView
      state={state}
      onState={setState}
      onNewGame={() => setState(null)}
      coachEnabled={coach}
      watchTurns={watchTurns}
    />
  )
}

export default App
