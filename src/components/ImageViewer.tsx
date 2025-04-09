import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import OpenSeadragon, { Options, Viewer } from "openseadragon";
import { AlertResponse, BoundingBoxTypes, ImageState } from "@/types";
import ControlButtons from "./ControlButtons";
import { Loader2 } from "lucide-react";
import OverlayComponent from "./OverlayComponent";

const VIEWER_CONFIG: Options = {
  element: undefined,
  immediateRender: true,
  imageLoaderLimit: 1,
  prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
  gestureSettingsMouse: {
    clickToZoom: false,
    dblClickToZoom: false,
  },
  gestureSettingsTouch: {
    pinchToZoom: true,
    clickToZoom: false,
    dblClickToZoom: false,
    flickEnabled: true,
  },
  showNavigationControl: false,
  maxZoomLevel: 10,
  minZoomImageRatio: 1,
  animationTime: 0.6,
  visibilityRatio: 1,
  maxImageCacheCount: 0, // Disable image caching
  constrainDuringPan: true,
  drawer: "canvas",
};

// Initial States
const initialImageState: ImageState = {
  imageId: "",
  src: "",
  isInitialLoading: true,
  dimensions: { width: 5000, height: 5000 },
};

const ImageViewer: React.FC = memo(() => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<OpenSeadragon.Viewer | null>(null);

  const [boxIds, setBoxIds] = useState<Set<string>>(new Set());

  const [isViewerReady, setIsViewerReady] = useState(false);
  const [imageState, setImageState] = useState<ImageState>(initialImageState);
  const [imageBoundingBoxes, setImageBoundingBoxes] = useState<
    BoundingBoxTypes[]
  >([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const fetchImage = useCallback(async () => {
    try {
      const response = {
        data: {
          image_id: "12345",
          image_url: "https://wallpaperaccess.com/full/4601229.png",
        },
      };
      if (!response.data) throw new Error("Failed to fetch image");

      const data = response.data;
      setImageState((prev) => ({
        ...prev,
        imageId: data.image_id,
        src: data.image_url,
        error: null,
      }));
    } catch (error) {
      setImageState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const fetchBoxes = useCallback(async () => {
    if (!imageState.src) return;
    try {
      const dummyData: AlertResponse["data"] = {
        bounding_boxes: [
          {
            id: "box1",
            coordinates: [500, 700, 600, 800],
          },
          {
            id: "box2",
            coordinates: [1500, 1700, 1600, 1800],
          },
          {
            id: "box3",
            coordinates: [1300, 1900, 1800, 2000],
          },
        ],
      };

      console.log("Dummy Data:", dummyData);

      const boxes = dummyData.bounding_boxes.flatMap(
        (box: BoundingBoxTypes) => ({
          id: box.id,
          coordinates: box.coordinates,
        })
      );

      // Check for new IDs
      const newBoxIds = boxes
        .map((box) => box.id)
        .filter((id) => boxIds.has(id) === false);

      setBoxIds((prev) => new Set([...prev, ...newBoxIds]));
      setImageBoundingBoxes(boxes);
    } catch (error) {
      console.error("Error fetching bounding boxes:", error);
    }
  }, [imageState.src, boxIds]);

  const handleBoxClick = useCallback(
    async (boxId: string, accepted: boolean) => {
      setImageBoundingBoxes((prev) => prev.filter(({ id }) => id !== boxId));

      try {
        // create a dummy API call to acknowledge the box
        const res = new Promise<{ status: number }>((resolve) => {
          setTimeout(() => {
            console.log("Acknowledged box:", boxId, "accepted:", accepted);
            resolve({ status: 200 });
          }, 1000);
        });
        const response = await res;
        if (response.status === 200) {
          console.log("Box acknowledged successfully");
        }
      } catch (error) {
        console.error("Error acknowledging box:", error);
      }
    },
    []
  );

  // Viewer Controls
  const handleReset = useCallback(() => {
    viewerInstance.current?.viewport.goHome();
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      setIsFullscreen(true);
      containerRef.current.requestFullscreen();
    } else {
      setIsFullscreen(false);
      document.exitFullscreen();
    }
  }, []);

  /**
   * Handles the change in fullscreen mode.
   *
   * This function is triggered when the fullscreen state changes. It updates the
   * `isFullscreen` state based on the current fullscreen status.
   *
   * @callback handleFullscreenChange
   * @returns {void}
   */
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  }, []);

  // Effects
  useEffect(() => {
    fetchImage();
  }, []);

  useEffect(() => {
    if (imageState.src && !imageState.isInitialLoading) {
      fetchBoxes();
    }
  }, [imageState.src, imageState.isInitialLoading]);

  // Initialize Viewer
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer: Viewer = OpenSeadragon({
      ...VIEWER_CONFIG,
      element: viewerRef.current,
    });

    viewerInstance.current = viewer;
    setIsViewerReady(true);

    return () => {
      viewer.destroy();
      viewerInstance.current?.destroy();
      viewerInstance.current = null;
    };
  }, [viewerRef]);

  // Load Image
  useEffect(() => {
    if (!viewerInstance.current || imageState.src === "") return;

    viewerInstance.current.addSimpleImage({
      url: imageState.src,
      success: () => {
        // Get the total number of items in the viewer instance, and remove the first image if there are more than one to prevent stacking images and keep the viewer clean...
        const totalItems = viewerInstance.current?.world.getItemCount();
        if (totalItems && totalItems > 1) {
          const firstRenderedImage = viewerInstance.current?.world.getItemAt(0);

          if (firstRenderedImage) {
            // Remove the current image without affecting overlays
            viewerInstance.current?.world.removeItem(firstRenderedImage);
          }
        }

        setImageState((prev) => ({ ...prev, isInitialLoading: false }));
      },
    });
  }, [imageState.src, viewerInstance]);

  // Fullscreen Handlers
  useEffect(() => {
    const fullscreenEvents = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];

    fullscreenEvents.forEach((event) => {
      document.addEventListener(event, handleFullscreenChange);
    });

    handleReset();

    return () => {
      fullscreenEvents.forEach((event) => {
        document.removeEventListener(event, handleFullscreenChange);
      });
    };
  }, [isFullscreen]);

  return (
    <div className="flex flex-col bg-background h-full">
      <div className="bg-background p-4 mt-4">
        <div
          className="max-w-3xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden"
          ref={containerRef}
        >
          <ControlButtons
            onReset={handleReset}
            onFullscreen={toggleFullScreen}
            isFullscreen={isFullscreen}
          />

          <div className="flex-1 relative h-full">
            <div
              ref={viewerRef}
              className="w-full min-h-fit focus:outline-none"
              style={{
                height: isFullscreen ? "calc(100% - 50px)" : "calc(80svh)",
              }}
            />
            {isViewerReady && imageState.isInitialLoading && (
              <div className="flex justify-center flex-col items-center absolute inset-0 z-10">
                <Loader2 className="animate-spin mr-2 text-primary-text" />
                <p className="mt-2 text-primary-text">{"Loading image..."}</p>
              </div>
            )}

            {isViewerReady && !imageState.isInitialLoading && (
              <OverlayComponent
                imageState={imageState}
                bbox={imageBoundingBoxes}
                viewer={viewerInstance.current}
                onBoxClick={handleBoxClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ImageViewer;
