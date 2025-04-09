import OpenSeadragon from "openseadragon";
import { BoundingBoxTypes, ImageState } from "./index";

/**
 * Main props for the OverlayComponent
 */
export interface OverlayProps {
  imageState: ImageState;
  bbox: BoundingBoxTypes[];
  viewer: OpenSeadragon.Viewer | null;
  onBoxClick: (boxId: string, accepted: boolean) => void;
}

/**
 * Represents an overlay element in the DOM with its buttons
 */
export interface OverlayElement {
  element: HTMLElement;
  buttons: CustomButton[];
  leftContainer?: HTMLElement;
  rightContainer?: HTMLElement;
}

/**
 * Extended OpenSeadragon button with element reference
 */
export interface CustomButton extends OpenSeadragon.Button {
  element: HTMLElement;
}

/**
 * Configuration options for creating OpenSeadragon buttons
 */
export interface ButtonOptions {
  id: string;
  tooltip: string;
  bboxId: string;
  type: "accept" | "reject";
  disabled?: boolean;
}

/**
 * Props for the ControlButton React component
 */
export interface ButtonProps {
  bboxId: string;
  type: "accept" | "reject";
  onClick: (boxId: string, accepted: boolean) => void;
}
