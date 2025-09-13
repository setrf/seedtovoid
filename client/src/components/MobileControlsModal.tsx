import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { StatsPanel } from "./StatsPanel";
import { GameControls } from "./GameControls";

interface MobileControlsModalProps {
  open: boolean;
  onClose: () => void;
}

export function MobileControlsModal({ open, onClose }: MobileControlsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="onboarding-modal mobile-controls-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="onboarding-title">Controls</DialogTitle>
        </DialogHeader>
        <div className="mobile-controls-content">
          <StatsPanel />
          <GameControls />
        </div>
      </DialogContent>
    </Dialog>
  );
}
