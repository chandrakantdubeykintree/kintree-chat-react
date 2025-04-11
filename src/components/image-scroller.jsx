import { useEffect, useState } from "react";

const ImageScroller = () => {
  const scrollerImage = [
    "/illustrations/illustration_1.png",
    "/illustrations/illustration_2.png",
    "/illustrations/illustration_3.png",
    "/illustrations/illustration_4.png",
    "/illustrations/illustration_5.png",
    "/illustrations/illustration_6.png",
    "/illustrations/illustration_7.png",
    "/illustrations/illustration_8.png",
    "/illustrations/illustration_1.png",
    "/illustrations/illustration_2.png",
    "/illustrations/illustration_3.png",
    "/illustrations/illustration_4.png",
    "/illustrations/illustration_5.png",
    "/illustrations/illustration_6.png",
    "/illustrations/illustration_7.png",
    "/illustrations/illustration_8.png",
  ];

  const [shuffledImages, setShuffledImages] = useState([]);

  function shuffleImages(array) {
    let shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }

  useEffect(() => {
    const shuffled = shuffleImages(scrollerImage);
    setShuffledImages(shuffled);

    const scrollers = document.querySelectorAll(".scroller");
    function addAnimation() {
      scrollers.forEach((scroller) => {
        scroller.setAttribute("data-animated", true);
        const scrollerInner = scroller.querySelector(".scroller__inner");
        const scrollerContent = Array.from(scrollerInner.children);
        scrollerContent.forEach((item) => {
          const duplicatedItem = item.cloneNode(true);
          duplicatedItem.setAttribute("aria-hidden", true);
          scrollerInner.appendChild(duplicatedItem);
        });
      });
    }
    addAnimation();
  }, []);

  return (
    <div className="grid grid-cols-6 gap-2 lg:gap-4 transform -rotate-[18deg] h-[250vh] m-[-30vh] bg-black">
      <div className="scroller flex-1 overflow-hidden mask-linear-gradient">
        <div className="scroller__inner flex flex-col gap-2 lg:gap-4 py-4 animate-scroll">
          {shuffledImages.map((image, index) => (
            <img key={index} className="w-full max-w-full" src={image} alt="" />
          ))}
        </div>
      </div>

      <div className="scroller flex-1 overflow-hidden mask-linear-gradient">
        <div className="scroller__inner reverse flex flex-col gap-2 lg:gap-4 py-4 animate-scroll">
          {shuffledImages.map((image, index) => (
            <img key={index} className="w-full max-w-full" src={image} alt="" />
          ))}
        </div>
      </div>

      <div className="scroller flex-1 overflow-hidden mask-linear-gradient">
        <div className="scroller__inner flex flex-col gap-2 lg:gap-4 py-4 animate-scroll">
          {shuffledImages.map((image, index) => (
            <img key={index} className="w-full max-w-full" src={image} alt="" />
          ))}
        </div>
      </div>

      <div className="scroller flex-1 overflow-hidden mask-linear-gradient">
        <div className="scroller__inner reverse flex flex-col gap-2 lg:gap-4 py-4 animate-scroll">
          {shuffledImages.map((image, index) => (
            <img key={index} className="w-full max-w-full" src={image} alt="" />
          ))}
        </div>
      </div>

      <div className="scroller flex-1 overflow-hidden mask-linear-gradient">
        <div className="scroller__inner flex flex-col gap-2 lg:gap-4 py-4 animate-scroll">
          {shuffledImages.map((image, index) => (
            <img key={index} className="w-full max-w-full" src={image} alt="" />
          ))}
        </div>
      </div>

      <div className="scroller flex-1 overflow-hidden mask-linear-gradient">
        <div className="scroller__inner reverse flex flex-col gap-2 lg:gap-4 py-4 animate-scroll">
          {shuffledImages.map((image, index) => (
            <img key={index} className="w-full max-w-full" src={image} alt="" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageScroller;
