import ReactConfetti from "react-confetti";
import { useConfettiStore } from "../services/confettiStore";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Confetti() {
  const { isOpen, closeConfetti, duration, points } = useConfettiStore();
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const ribbonTimer = setTimeout(() => {
        closeConfetti();
      }, 2000);

      const confettiTimer = setTimeout(() => {}, duration);

      return () => {
        clearTimeout(ribbonTimer);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen, closeConfetti, duration]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9997 }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9998 }}
      >
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={150}
          confettiSource={{
            x: windowDimensions.width / 2,
            y: windowDimensions.height / 2,
          }}
          initialVelocityX={15}
          initialVelocityY={30}
          gravity={0.4}
          spread={360}
          ticks={200}
          colors={["#FFD700", "#FFA500", "#FF6347", "#FF69B4", "#4169E1"]}
          drawShape={(ctx) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              ctx.lineTo(
                Math.cos((2 * Math.PI * i) / 6) * 5,
                Math.sin((2 * Math.PI * i) / 6) * 5
              );
            }
            ctx.closePath();
            ctx.fill();
          }}
        />
      </div>
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 9999 }}
      >
        <AnimatePresence>
          {points !== null && (
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  rotateX: [0, 360],
                }}
                transition={{
                  scale: { duration: 0.3 },
                  rotateX: {
                    duration: 1,
                    repeat: 2,
                    ease: "easeInOut",
                  },
                }}
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                }}
                className="mb-2"
              >
                <img
                  src="/kincoinsImg/kintree_coin.svg"
                  alt="Kincoin"
                  className="w-16 h-16 md:w-20 md:h-20"
                  style={{
                    backfaceVisibility: "visible",
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className="relative"
              >
                <img
                  src="/kincoinsImg/Group.png"
                  alt="Ribbon"
                  className="w-[200px] md:w-[250px]"
                />
                <div className="absolute inset-0 flex items-center justify-center -translate-y-[10%]">
                  <div className="text-center w-[140px] md:w-[180px]">
                    <p className="text-sm font-bold text-white">🎉</p>
                    <p className="text-sm font-bold text-white leading-tight">
                      You have earned {points} kincoins!
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
