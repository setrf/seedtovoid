import { useGameOfLife, DifficultyMode } from "../lib/stores/useGameOfLife";
import { Shield, BrainCircuit, Skull } from "lucide-react";

export function DifficultySelector() {
  const { difficultyMode, setDifficultyMode } = useGameOfLife();

  const difficulties: { id: DifficultyMode, name: string, icon: React.ReactNode }[] = [
    { id: 'easy', name: 'Easy', icon: <Shield size={16} /> },
    { id: 'normal', name: 'Normal', icon: <BrainCircuit size={16} /> },
    { id: 'hard', name: 'Hard', icon: <Skull size={16} /> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">Difficulty</div>
      <div className="panel-content" style={{ padding: '8px' }}>
        <div className="difficulty-selector">
          {difficulties.map(({ id, name, icon }) => (
            <button
              key={id}
              className={`difficulty-button ${difficultyMode === id ? 'active' : ''}`}
              onClick={() => setDifficultyMode(id)}
              title={name}
            >
              <div className="difficulty-icon">{icon}</div>
              <span className="difficulty-name">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
