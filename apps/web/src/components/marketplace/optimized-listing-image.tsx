import Image, { type ImageProps } from 'next/image';

type OptimizedListingImageProps = Omit<ImageProps, 'loader' | 'unoptimized'>;

function isCloudinaryImage(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;

  try {
    const url = new URL(src);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      /^\/[^/]+\/image\/upload(?:\/|$)/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

/** Apply Next's responsive image optimization to stored Cloudinary listing photos. */
export function OptimizedListingImage(props: OptimizedListingImageProps) {
  const { alt, ...imageProps } = props;
  return (
    <Image
      {...imageProps}
      alt={alt}
      quality={imageProps.quality ?? 65}
      unoptimized={!isCloudinaryImage(props.src)}
    />
  );
}
