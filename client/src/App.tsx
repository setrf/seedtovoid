import { useState, useEffect } from "react";
import { GameOfLife } from "./components/GameOfLife";
import { OnboardingModal } from "./components/OnboardingModal";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { useGameOfLife } from "./lib/stores/useGameOfLife";

function App() {
  const { survivalMode, gameState, loadHighScores, difficultyMode } = useGameOfLife();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadHighScores();
  }, [loadHighScores, difficultyMode]);

  useEffect(() => {
    // Show the modal on initial load
    setShowOnboarding(true);
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'h' || event.key === 'H') {
        if (!showOnboarding) {
          setShowOnboarding(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showOnboarding]);

  return (
    <div className="app-shell">
      {/* Fixed top area for global tools */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            GAME OF LIFE <span className="long-title">- SURVIVAL EDITION</span>
          </h1>
          <div className="header-status">
            <span className="status-label" style={{ fontSize: "9px", opacity: 0.7 }}>
              Press H for help
            </span>
          </div>
        </div>
      </header>

      {/* Main work canvas */}
      <main className="app-main">
        <GameOfLife />
      </main>

      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
      />
    </div>
  );
}

export default App;
