import React from "react";
import { Minimize, Maximize, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface ControlButtonsProps {
  onReset: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  fullscreenButtonText?: string;
  exitFullscreenButtonText?: string;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  onReset,
  onFullscreen,
  isFullscreen,
  fullscreenButtonText = " Expand",
  exitFullscreenButtonText = " Exit",
}) => {
  return (
    <div className="relative bg-muted flex justify-end items-center py-2 px-4 border-b gap-4 z-50">
      <div className="flex gap-4">
        <Button
          onClick={onReset}
          variant="secondary"
          size="sm"
          title="Reset Zoom"
        >
          <RefreshCcw /> Reset Zoom
        </Button>
        <Button
          onClick={onFullscreen}
          variant="secondary"
          size="sm"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
          {isFullscreen ? exitFullscreenButtonText : fullscreenButtonText}
        </Button>
      </div>
    </div>
  );
};

export default ControlButtons;
