import { BoundingBoxTypes } from "@/types";

/**
 * Converts pixel coordinates to viewport coordinates
 * @param bbox Bounding box with pixel coordinates
 * @param imgWidth Image width
 * @param imgHeight Image height
 * @returns Viewport coordinates object
 */
export const pixelToViewportCoordinates = (
  bbox: BoundingBoxTypes,
  imgWidth: number,
  imgHeight: number
) => ({
  x: bbox.coordinates[0] / imgWidth,
  y: bbox.coordinates[1] / imgHeight,
  width: (bbox.coordinates[2] - bbox.coordinates[0]) / imgWidth,
  height: (bbox.coordinates[3] - bbox.coordinates[1]) / imgHeight,
});

/**
 * Returns styles for accept/reject buttons
 * @param type Button type ('accept' or 'reject')
 * @returns Object containing className and innerHTML
 */
export const getButtonStyles = (type: "accept" | "reject") => ({
  className: `osd-button ${
    type === "accept"
      ? "bg-primary hover:bg-primary/90"
      : "bg-red-500 hover:bg-red-600"
  } text-white px-2 py-1 rounded text-xs transition-colors`,
  innerHTML: type === "accept" ? "✓" : "✕",
});

/**
 * Calculates the appropriate scale factor based on zoom level
 * @param zoom Current zoom level
 * @returns Scale factor between 0.5 and 2
 */
export const calculateScaleFactor = (zoom: number) => {
  return Math.max(0.5, Math.min(1 + (zoom - 1) * 0.3, 2));
};
