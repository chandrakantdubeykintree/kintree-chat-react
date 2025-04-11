import { useTranslation } from "react-i18next";
import { Card } from "./ui/card";
import { encryptId } from "@/utils/encryption";
import { signSignList } from "@/constants/sunsignList";
import { Link } from "react-router";
import { capitalizeName } from "@/utils/stringFormat";
import { motion, AnimatePresence } from "framer-motion";

export default function SunSignList() {
  const { t } = useTranslation();

  const FlipCard = ({ children, sign, delay }) => {
    return (
      <div className="relative h-[140px] md:h-[180px]">
        <motion.div
          initial={{ rotateY: -180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          whileHover={{
            rotateY: 180,
            transition: { duration: 0.3 },
          }}
          transition={{
            duration: 0.5,
            delay: delay,
            ease: "easeOut",
          }}
          className="w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          {/* Front side */}
          <motion.div
            className="absolute w-full h-full"
            style={{
              backfaceVisibility: "hidden",
            }}
          >
            {children}
          </motion.div>

          {/* Back side - Same structure as front */}
          <motion.div
            className="absolute w-full h-full"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <Link
              className="flex flex-col justify-center items-center h-full"
              to={`/astrology/horoscope/${sign.name}/${encryptId(sign.id)}`}
            >
              <div className="h-[80px] w-[80px] md:h-[100px] md:w-[100px] flex items-center justify-center bg-[#EAD9E5] rounded-full">
                <img
                  src={sign.img_src}
                  alt={sign.name}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <div className="flex flex-col justify-center items-center mt-2">
                <h3 className="text-base md:text-lg font-semibold text-primary">
                  {capitalizeName(sign.name)}
                </h3>
                <p className="text-xs md:text-sm text-gray-500">{sign.date}</p>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  };

  return (
    <Card className="rounded-2xl py-6 px-2 md:px-6">
      <div className="text-[18px] font-semibold mb-6">
        {t("daily_horoscope")}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-x-2 md:gap-x-4 gap-y-6">
        {signSignList?.map((sign, index) => (
          <FlipCard key={index} sign={sign} delay={index * 0.1}>
            <Link
              className="flex flex-col justify-center items-center h-full"
              to={`/astrology/horoscope/${sign.name}/${encryptId(sign.id)}`}
            >
              <div className="h-[80px] w-[80px] md:h-[100px] md:w-[100px] flex items-center justify-center bg-[#EAD9E5] rounded-full">
                <img
                  src={sign.img_src}
                  alt={sign.name}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <div className="flex flex-col justify-center items-center mt-2">
                <h3 className="text-base md:text-lg font-semibold text-primary">
                  {capitalizeName(sign.name)}
                </h3>
                <p className="text-xs md:text-sm text-gray-500">{sign.date}</p>
              </div>
            </Link>
          </FlipCard>
        ))}
      </div>
    </Card>
  );
}
