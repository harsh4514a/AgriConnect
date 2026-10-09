export const MAX_LISTING_IMAGES = 5;
export const MAX_LISTING_IMAGE_SIZE = 5 * 1024 * 1024;

export interface ListingImage {
  url: string;
  file?: File;
}
