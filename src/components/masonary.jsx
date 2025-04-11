import { useState, useEffect, useMemo, useRef } from "react";
import { useTransition, a } from "@react-spring/web";

const ImageComponent = ({ src, alt, onClick, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get image dimensions before rendering
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden group h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-shimmer" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onClick={onClick}
      />

      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
          />
        </svg>
      </div>
    </div>
  );
};

function Masonry({ images, onImageClick, className }) {
  const containerRef = useRef();
  const [columns, setColumns] = useState(3);
  const [containerWidth, setContainerWidth] = useState(0);
  const [imagesDimensions, setImagesDimensions] = useState([]);

  // Load all image dimensions
  useEffect(() => {
    const loadImageDimensions = async () => {
      const dimensions = await Promise.all(
        images.map(
          (src) =>
            new Promise((resolve) => {
              const img = new Image();
              img.src = src;
              img.onload = () => {
                resolve({
                  width: img.width,
                  height: img.height,
                  aspectRatio: img.width / img.height,
                });
              };
            }),
        ),
      );
      setImagesDimensions(dimensions);
    };

    loadImageDimensions();
  }, [images]);

  useEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.getBoundingClientRect().width;
      setContainerWidth(width);

      // Adjust columns based on container width
      if (width >= 1536) setColumns(4);
      else if (width >= 1280) setColumns(3);
      else if (width >= 1024) setColumns(3);
      else if (width >= 768) setColumns(3);
      else setColumns(2);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);

    const resizeObserver = new ResizeObserver(updateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateLayout);
      resizeObserver.disconnect();
    };
  }, []);

  const gridItems = useMemo(() => {
    if (!containerWidth || imagesDimensions.length === 0) return [];

    const columnWidth = containerWidth / columns;
    const columnHeights = new Array(columns).fill(0);
    const gap = 4;

    return images.map((image, i) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const x = shortestColumn * columnWidth;
      const y = columnHeights[shortestColumn];

      // Calculate height based on aspect ratio
      const imgDimensions = imagesDimensions[i];
      const width = columnWidth - gap;
      const height = width / (imgDimensions?.aspectRatio || 1);

      columnHeights[shortestColumn] += height + gap;

      return {
        id: i,
        src: image,
        x,
        y,
        width: width,
        height,
      };
    });
  }, [images, columns, containerWidth, imagesDimensions]);

  const transitions = useTransition(gridItems, {
    keys: (item) => item.id,
    from: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 0 }),
    enter: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 1 }),
    update: ({ x, y, width, height }) => ({ x, y, width, height }),
    leave: { height: 0, opacity: 0 },
    config: { mass: 5, tension: 500, friction: 100 },
    trail: 25,
  });

  const containerHeight = Math.max(
    ...gridItems.map((item) => item.y + item.height),
    0,
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        style={{
          height: containerHeight + 16,
          position: "relative",
        }}
      >
        {transitions((style, item) => (
          <a.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
              width: item.width,
              height: item.height,
              padding: "8px",
            }}
          >
            <ImageComponent
              src={item.src}
              alt={`Image ${item.id}`}
              onClick={() => onImageClick?.(item.src)}
              className="rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            />
          </a.div>
        ))}
      </div>
    </div>
  );
}

export default Masonry;
