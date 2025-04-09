import React, { useEffect, useCallback, memo, useRef } from "react";
import OpenSeadragon from "openseadragon";
import { BoundingBoxTypes } from "@/types";
import { createRoot } from "react-dom/client";
import { Button } from "./ui/button";
import {
  ButtonOptions,
  ButtonProps,
  CustomButton,
  OverlayElement,
  OverlayProps,
} from "@/types/overlay";
import {
  calculateScaleFactor,
  getButtonStyles,
  pixelToViewportCoordinates,
} from "@/utils/overlayUtils";

// ===== Sub-Components =====
/**
 * Button component for accepting or rejecting a bounding box
 */
const ControlButton: React.FC<ButtonProps> = ({ bboxId, type, onClick }) => {
  return (
    <Button
      variant={type === "accept" ? "default" : "destructive"}
      size="sm"
      onClick={() => onClick(bboxId, type === "accept")}
      className="min-w-6 h-6 px-2"
    >
      {type === "accept" ? "✓" : "✕"}
    </Button>
  );
};

// ===== Main Component =====

/**
 * Component that creates overlays for bounding boxes in an OpenSeadragon viewer
 */
const OverlayComponent: React.FC<OverlayProps> = ({
  bbox,
  imageState,
  viewer,
  onBoxClick,
}) => {
  // ===== State & Refs =====
  const activeOverlaysRef = useRef<Map<string, OverlayElement>>(new Map());
  const debouncedZoomRef = useRef<number | null>(null);
  const useCustomButtons = true;

  // ===== Button Creation =====

  /**
   * Creates an OpenSeadragon button with the specified options
   */
  const createOSDButton = useCallback(
    (options: ButtonOptions): CustomButton => {
      const button = document.createElement("button");
      const { className, innerHTML } = getButtonStyles(options.type);

      button.className = className;
      button.innerHTML = innerHTML;
      button.title = options.tooltip;

      if (options.disabled) {
        button.disabled = true;
        button.className += " opacity-50 cursor-not-allowed";
      }

      return new OpenSeadragon.Button({
        element: button,
        tooltip: options.tooltip,
        onClick: () => onBoxClick(options.bboxId, options.type === "accept"),
      }) as CustomButton;
    },
    [onBoxClick]
  );

  // ===== Overlay Creation & Management =====

  /**
   * Creates an overlay element for a bounding box
   */
  const createOverlayElement = useCallback(
    (bbox: BoundingBoxTypes): OverlayElement => {
      // Create main container
      const container = document.createElement("div");
      container.className = "relative";
      container.style.cssText = "width: 100%; height: 100%;";

      // Create bounding box container
      const bboxContainer = document.createElement("div");
      bboxContainer.className = "absolute inset-0 border-2 border-red-500";

      let buttons: CustomButton[] = [];
      let leftContainer: HTMLElement | undefined;
      let rightContainer: HTMLElement | undefined;

      // Create button containers with common styles
      const createButtonContainer = (
        position: "left" | "right"
      ): HTMLElement => {
        const container = document.createElement("div");
        container.className = `absolute top-1/2 transform origin-${
          position === "left" ? "right" : "left"
        } transition-transform`;
        container.style.cssText = `${position}: 0; transform: translate(${
          position === "left" ? "-108%" : "108%"
        }, -50%);`;
        return container;
      };

      if (useCustomButtons) {
        // For touch devices, use React buttons
        leftContainer = createButtonContainer("left");
        rightContainer = createButtonContainer("right");

        const leftRoot = createRoot(leftContainer);
        const rightRoot = createRoot(rightContainer);

        leftRoot.render(
          <ControlButton bboxId={bbox.id} type="accept" onClick={onBoxClick} />
        );

        rightRoot.render(
          <ControlButton bboxId={bbox.id} type="reject" onClick={onBoxClick} />
        );
      } else {
        // For non-touch devices, use OSD buttons
        leftContainer = createButtonContainer("left");
        rightContainer = createButtonContainer("right");

        const acceptButton = createOSDButton({
          id: `accept-${bbox.id}`,
          tooltip: "Accept",
          bboxId: bbox.id,
          type: "accept",
        });

        const rejectButton = createOSDButton({
          id: `reject-${bbox.id}`,
          tooltip: "Reject",
          bboxId: bbox.id,
          type: "reject",
        });

        buttons = [acceptButton, rejectButton];

        leftContainer.appendChild(acceptButton.element);
        rightContainer.appendChild(rejectButton.element);
      }

      // Append containers to bounding box
      bboxContainer.append(leftContainer, rightContainer);
      container.appendChild(bboxContainer);

      // Create and return the overlay element
      const overlayElement: OverlayElement = {
        element: container,
        buttons,
        leftContainer,
        rightContainer,
      };

      return overlayElement;
    },
    [useCustomButtons, onBoxClick, createOSDButton]
  );

  /**
   * Updates button sizes based on current zoom level
   */
  const updateButtonSizes = useCallback(() => {
    if (!viewer?.viewport) return;

    const zoom = viewer.viewport.getZoom(true) || 1;
    const scaleFactor = calculateScaleFactor(zoom);

    // Use requestAnimationFrame for smoother UI updates during zoom
    requestAnimationFrame(() => {
      activeOverlaysRef.current.forEach((overlay) => {
        if (overlay.leftContainer) {
          overlay.leftContainer.style.transform = `translate(-108%, -50%) scale(${scaleFactor})`;
        }

        if (overlay.rightContainer) {
          overlay.rightContainer.style.transform = `translate(108%, -50%) scale(${scaleFactor})`;
        }
      });
    });
  }, [viewer]);

  /**
   * Cleans up an overlay by removing it from the viewer
   */
  const cleanupOverlay = useCallback(
    (overlay: OverlayElement) => {
      if (overlay.element && viewer) {
        viewer.removeOverlay(overlay.element);
        overlay.element.remove();
      }
    },
    [viewer]
  );

  // ===== Effects =====

  /**
   * Effect to manage overlay lifecycle
   * Handles creation, updates, and removal of overlays based on bbox changes
   */
  useEffect(() => {
    if (!viewer?.isOpen() || !imageState.dimensions || !imageState.src) return;

    const overlaysMap = activeOverlaysRef.current;
    const incomingBboxIds = new Set(bbox.map((box) => box.id));

    // First, clean up removed overlays
    Array.from(overlaysMap.entries()).forEach(([existingId, overlay]) => {
      if (!incomingBboxIds.has(existingId)) {
        cleanupOverlay(overlay);
        overlaysMap.delete(existingId);
      }
    });

    // Then, add new overlays
    bbox.forEach((box) => {
      if (overlaysMap.has(box.id)) return;

      try {
        const viewport = pixelToViewportCoordinates(
          box,
          imageState.dimensions.width,
          imageState.dimensions.height
        );

        const overlayElement = createOverlayElement(box);
        overlayElement.element.id = `overlay-${box.id}`;

        viewer.addOverlay({
          element: overlayElement.element,
          location: new OpenSeadragon.Rect(
            viewport.x,
            viewport.y,
            viewport.width,
            viewport.height
          ),
          placement: OpenSeadragon.Placement.TOP_LEFT,
          rotationMode: OpenSeadragon.OverlayRotationMode.NO_ROTATION,
          checkResize: false,
        });

        overlaysMap.set(box.id, overlayElement);
      } catch (error) {
        console.error(`Failed to create overlay for bbox ${box.id}:`, error);
      }
    });

    updateButtonSizes();

    return () => {
      // Cleanup all overlays when component unmounts or viewer changes
      overlaysMap.forEach(cleanupOverlay);
      overlaysMap.clear();
    };
  }, [
    bbox,
    imageState.dimensions,
    imageState.src,
    viewer,
    createOverlayElement,
    cleanupOverlay,
    updateButtonSizes,
  ]);

  /**
   * Effect to handle zoom events with debouncing
   */
  useEffect(() => {
    if (!viewer) return;

    const onZoom = () => {
      // Cancel previous debounced update
      if (debouncedZoomRef.current !== null) {
        window.cancelAnimationFrame(debouncedZoomRef.current);
      }

      // Schedule new update
      debouncedZoomRef.current = window.requestAnimationFrame(() => {
        updateButtonSizes();
        debouncedZoomRef.current = null;
      });
    };

    viewer.addHandler("zoom", onZoom);

    return () => {
      viewer.removeHandler("zoom", onZoom);
      if (debouncedZoomRef.current !== null) {
        window.cancelAnimationFrame(debouncedZoomRef.current);
      }
    };
  }, [viewer, updateButtonSizes]);

  return null;
};

export default memo(OverlayComponent);
