import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const CustomCarousel = ({
  items,
  renderItem,
  itemWidth = 200,
  gap = 16,
  showDots = true,
  showArrows = true, // New prop for arrow visibility
  infinite = false, // New prop for infinite scrolling
  autoplay = false,
  autoplayDelay = 3000,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  // Calculate items per view based on container width
  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setContainerWidth(width);
      const itemsToShow = Math.floor((width + gap) / (itemWidth + gap));
      setItemsPerView(Math.max(1, itemsToShow));
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [itemWidth, gap]);

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, currentIndex]);

  const handleNext = () => {
    if (infinite) {
      setCurrentIndex((prev) =>
        prev >= items.length - itemsPerView ? 0 : prev + 1
      );
    } else {
      const maxIndex = Math.max(0, items.length - itemsPerView);
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
  };

  const handlePrev = () => {
    if (infinite) {
      setCurrentIndex((prev) =>
        prev <= 0 ? items.length - itemsPerView : prev - 1
      );
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const maxScrollIndex = Math.max(0, items.length - itemsPerView);
  const showNavigation = showArrows && items.length > itemsPerView;

  // Prepare items for infinite scroll
  const displayItems = infinite
    ? [...items, ...items, ...items] // Triple the items for smooth infinite scroll
    : items;

  // Adjust transform for infinite scroll
  const getTransformX = () => {
    if (!infinite) return currentIndex * (itemWidth + gap);

    // For infinite scroll, add one set of items worth of offset
    const baseOffset = items.length * (itemWidth + gap);
    return baseOffset + currentIndex * (itemWidth + gap);
  };

  // Handle infinite scroll position reset
  useEffect(() => {
    if (!infinite) return;

    const handleTransitionEnd = () => {
      if (currentIndex >= items.length) {
        // If we've scrolled past the first set, jump back to the equivalent position in the original set
        setCurrentIndex(currentIndex - items.length);
      } else if (currentIndex < 0) {
        // If we've scrolled before the first set, jump forward to the equivalent position
        setCurrentIndex(currentIndex + items.length);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("transitionend", handleTransitionEnd);
      return () =>
        container.removeEventListener("transitionend", handleTransitionEnd);
    }
  }, [infinite, currentIndex, items.length]);

  // Handle mouse down event
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(currentIndex * (itemWidth + gap));
    setAutoplayPaused(true);
  };

  // Handle touch start event
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(currentIndex * (itemWidth + gap));
    setAutoplayPaused(true);
  };

  // Handle mouse/touch move
  const handleMove = (clientX) => {
    if (!isDragging) return;

    const x = clientX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiply by 1.5 to make scrolling more responsive
    const newIndex = Math.round((scrollLeft - walk) / (itemWidth + gap));

    if (infinite) {
      setCurrentIndex(Math.max(0, newIndex));
    } else {
      setCurrentIndex(
        Math.max(0, Math.min(newIndex, items.length - itemsPerView))
      );
    }
  };

  // Handle mouse move event
  const handleMouseMove = (e) => {
    handleMove(e.pageX);
  };

  // Handle touch move event
  const handleTouchMove = (e) => {
    handleMove(e.touches[0].pageX);
  };

  // Handle mouse/touch end
  const handleDragEnd = () => {
    setIsDragging(false);
    setTimeout(() => setAutoplayPaused(false), 1000); // Resume autoplay after 1 second
  };

  // Modify autoplay effect to respect paused state
  useEffect(() => {
    if (!autoplay || autoplayPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, currentIndex, autoplayPaused]);

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-background/80 border flex items-center justify-center hover:bg-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-8 w-8 rounded-full bg-background/80 border flex items-center justify-center hover:bg-background"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      {/* <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${getTransformX()}px)`,
            gap: `${gap}px`,
          }}
        >
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: itemWidth }}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div> */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <div
          className={`flex transition-transform duration-300 ease-out ${
            isDragging ? "transition-none" : ""
          }`}
          style={{
            transform: `translateX(-${getTransformX()}px)`,
            gap: `${gap}px`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 select-none"
              style={{ width: itemWidth }}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      {showDots && !infinite && items.length > itemsPerView && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: maxScrollIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentIndex === index ? "bg-primary" : "bg-primary/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomCarousel;
