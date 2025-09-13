import React, { useState } from "react";
import { useGameOfLife } from "../lib/stores/useGameOfLife";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { startNewSurvivalRun, setUsername, username } = useGameOfLife();
  const [currentStep, setCurrentStep] = useState(0);
  const [localUsername, setLocalUsername] = useState(username);

  const steps = [
    {
      title: "🚀 Welcome to Game of Life",
      subtitle: "Survival Edition",
      content: (
        <div className="onboarding-welcome">
          <p className="mission-statement">
            You are the commander of a resilient cellular colony (🟢). 
            Your mission: <strong>survive and expand</strong> against waves of hostile automata (🔴).
          </p>
          <div className="game-visual">
            <div className="colony-demo">
              <div className="colony-center"></div>
              <div className="threat-demo threat-1"></div>
              <div className="threat-demo threat-2"></div>
              <div className="threat-demo threat-3"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "📝 Enter Your Name",
      subtitle: "For the Leaderboard",
      content: (
        <div className="username-step">
          <input
            type="text"
            className="username-input"
            placeholder="Enter your name..."
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            maxLength={20}
          />
        </div>
      )
    },
    {
      title: "룰 Gameplay Rules",
      subtitle: "Red vs. Green",
      content: (
        <div className="gameplay-rules">
          <div className="rule-item">
            <div className="rule-icon">⚔️</div>
            <div className="rule-content">
              <div className="rule-title">Survival of the Fittest</div>
              <div className="rule-desc">The board is a battlefield. When green and red cell groups touch, the <strong>larger group converts the smaller one</strong>.</div>
            </div>
          </div>
          <div className="rule-item">
            <div className="rule-icon">❤️</div>
            <div className="rule-content">
              <div className="rule-title">Colony Integrity</div>
              <div className="rule-desc">Your colony survives as long as you have <strong>at least one green cell</strong> on the grid. If all your cells are converted, it's game over.</div>
            </div>
          </div>
          {/* Removed outdated resource generation description */}
        </div>
      )
    },
    {
      title: "🕹️ Controls & Strategy",
      subtitle: "How to Play",
      content: (
        <div className="controls-tutorial">
          <div className="control-section">
            <div className="control-list">
              <div className="control-item">
                <div className="key">Click</div>
                <div className="control-desc">Manually add or remove a single cell on the grid.</div>
              </div>
              <div className="control-item">
                <div className="key">Patterns</div>
                <div className="control-desc">Select a pattern from the library and click on the grid to place it.</div>
              </div>
              <div className="control-item">
                <div className="key">Play/Pause</div>
                <div className="control-desc">Start or stop the simulation.</div>
              </div>
            </div>
          </div>
          <div className="control-section">
            <div className="control-title">Key to Survival</div>
            <div className="tip-list">
              <div className="tip-item"><strong>Expand Wisely:</strong> Use patterns to grow your colony and create buffer zones.</div>
              <div className="tip-item"><strong>Anticipate Threats:</strong> Enemies spawn near your cells. Be ready to defend.</div>
              <div className="tip-item"><strong>Convert & Conquer:</strong> Strategically grow your cell groups to be larger than approaching enemies.</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleStartGame = () => {
    setUsername(localUsername);
    startNewSurvivalRun();
    onClose();
  };

  const nextStep = () => {
    if (currentStep === 1) { // Username step
      setUsername(localUsername);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleStartGame();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="onboarding-modal max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="onboarding-title">
            {currentStepData.title}
            <span className="subtitle">{currentStepData.subtitle}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Onboarding tutorial for Game of Life Survival Edition - Step {currentStep + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="onboarding-content">
          {currentStepData.content}
        </div>

        <div className="onboarding-footer">
          <div className="step-indicators">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          
          <div className="onboarding-actions">
            {currentStep > 0 && (
              <button 
                className="button-secondary"
                onClick={prevStep}
              >
                Back
              </button>
            )}
            <button 
              className="button-primary start-button"
              onClick={nextStep}
            >
              {currentStep === steps.length - 1 ? 'START SURVIVAL' : 'Next'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
