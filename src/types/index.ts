export interface ImageState {
  imageId: string;
  src: string;
  isInitialLoading: boolean;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface GetImageResponse {
  image_id: string;
  image_url: string;
}

export interface DisplayedImageSize {
  displayWidth: number;
  displayHeight: number;
  originalWidth: number;
  originalHeight: number;
}

interface Coordinates {
  0: number;
  1: number;
  2: number;
  3: number;
}

export interface BoundingBoxTypes {
  id: string;
  coordinates: Coordinates;
}

export type AlertResponse = {
  message: string;
  data: {
    bounding_boxes: BoundingBoxTypes[];
  };
  errors: [];
};
