import AsyncComponent from "@/components/async-component";
import { Card } from "@/components/ui/card";
import { decryptId, encryptId } from "@/utils/encryption";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { signSignList } from "@/constants/sunsignList";
import { capitalizeName } from "@/utils/stringFormat";
import { format } from "date-fns";
import { useState } from "react";
import { CustomTabPanel, CustomTabs } from "@/components/ui/custom-tabs";
import { useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useRef } from "react";
import CustomCarousel from "@/components/custom-carousel";

export default function ZodiacSign() {
  const { id: encryptedId, sunsign } = useParams();
  const id = decryptId(encryptedId);
  const scrollableRef = useRef(null);
  const sunSignInfo = signSignList?.find(
    (item) => item.name === sunsign?.toLowerCase()
  );

  const location = useLocation();

  const { t } = useTranslation();

  const tabs = [
    { value: "personality", label: t("personality") },
    { value: "friendship", label: t("friendship") },
    { value: "love", label: t("love") },
    { value: "lifestyle", label: t("lifestyle") },
    { value: "health", label: t("health") },
    { value: "spirituality", label: t("spirituality") },
    { value: "career", label: t("career") },
  ];
  const [activeTab, setActiveTab] = useState("personality");

  const [sunSignData, setSunSignData] = useState(null);

  useEffect(() => {
    const loadSunSignData = async () => {
      try {
        const data = await import(`@/sun_sign/${sunsign.toLowerCase()}.json`);
        setSunSignData(data.default);
      } catch (error) {
        console.error("Error loading sun sign data:", error);
      }
    };

    loadSunSignData();
  }, [sunsign]);

  const tabStyles = {
    personality: {
      icon: "/astrology-img/personality.svg",
      gradient: "from-[#2C3E50] to-[#3498DB]",
    },
    friendship: {
      icon: "/astrology-img/friendship.svg",
      gradient: "from-[#FF6B6B] to-[#4ECDC4]",
    },
    love: {
      icon: "/astrology-img/love.svg",
      gradient: "from-[#FF4B6E] to-[#9F1B4F]",
    },
    lifestyle: {
      icon: "/astrology-img/lifestyle.svg",
      gradient: "from-[#8E44AD] to-[#2980B9]",
    },
    health: {
      icon: "/astrology-img/health.svg",
      gradient: "from-[#27AE60] to-[#2ECC71]",
    },
    spirituality: {
      icon: "/astrology-img/spirituality.svg",
      gradient: "from-[#D35400] to-[#E67E22]",
    },
    career: {
      icon: "/astrology-img/career.svg",
      gradient: "from-[#2C3E50] to-[#3498DB]",
    },
  };

  const TabContent = ({ tabKey }) => (
    <div
      className={`bg-gradient-to-br ${tabStyles[tabKey].gradient} rounded-xl p-6 text-white mb-8`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-white/20 p-3 rounded-full">
          <img
            src={tabStyles[tabKey].icon}
            alt={`${tabKey} Icon`}
            className="w-10 h-10"
          />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t(tabKey)}</h2>
      </div>

      <p className="text-base md:text-lg leading-relaxed">
        {sunSignData?.traits[tabKey]}
      </p>
    </div>
  );

  useEffect(() => {
    // Find the scrollable container
    const scrollableContainer =
      scrollableRef.current?.closest(".overflow-y-scroll");
    if (scrollableContainer) {
      scrollableContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [location.pathname, sunsign]);

  return (
    <AsyncComponent>
      <div
        ref={scrollableRef}
        className="grid grid-cols-1 space-y-4 mb-4 scroll-top"
      >
        <Card className="rounded-2xl py-6 px-4">
          <div className="bg-[url('/astrology-img/astrolog-bg.png')] bg-cover bg-center h-[200px] md:h-[300px] rounded-2xl relative">
            {/* Main container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Elements Layout */}
              <div className="absolute w-full h-full">
                {/* Top Element */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-lg md:text-xl text-white font-semibold line-clamp-1">
                    {sunSignInfo?.date}
                  </div>
                </div>

                {/* Top Right Element */}
                <div className="absolute top-[15%] right-4 md:right-8 text-center">
                  <div className="text-lg text-white font-normal">Element</div>
                  <div className="text-lg text-white font-semibold line-clamp-1">
                    {sunSignData?.attributes?.element}
                  </div>
                </div>

                {/* Bottom Right Element */}
                <div className="absolute bottom-[15%] right-4 md:right-8 text-center">
                  <div className="text-lg text-white font-normal">Planet</div>
                  <div className="text-lg text-white font-semibold line-clamp-1">
                    {sunSignData?.attributes?.ruling_planet}
                  </div>
                </div>

                {/* Bottom Element */}
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-lg md:text-xl text-white font-semibold line-clamp-1">
                    {capitalizeName(sunSignInfo?.name)}
                  </div>
                </div>

                {/* Bottom Left Element */}
                <div className="absolute bottom-[15%] left-4 md:left-8 text-center">
                  <div className="text-lg text-white font-normal">
                    Birthstone
                  </div>
                  <div className="text-lg text-white font-semibold line-clamp-1">
                    {sunSignData?.attributes?.birthstone}
                  </div>
                </div>

                {/* Top Left Element */}
                <div className="absolute top-[15%] left-4 md:left-8 text-center">
                  <div className="text-lg text-white font-normal">Quality</div>
                  <div className="text-lg text-white font-semibold line-clamp-1">
                    {sunSignData?.attributes?.quality}
                  </div>
                </div>

                {/* Center Image */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="h-[80px] w-[80px] md:h-[115px] md:w-[115px] flex items-center justify-center bg-[#EAD9E5] rounded-full z-10">
                    <img
                      src={sunSignInfo.img_src}
                      alt={sunSignInfo.name}
                      className="w-12 h-12 md:w-16 md:h-16"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background pt-4 rounded-2xl mt-8 overflow-x-scroll no_scrollbar">
            <CustomTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />
          </div>

          <div>
            {tabs.map((tab) => (
              <CustomTabPanel
                key={tab.value}
                value={tab.value}
                activeTab={activeTab}
              >
                <TabContent tabKey={tab.value} />
              </CustomTabPanel>
            ))}
          </div>

          <div className="text-[20px] font-bold text-primary mb-6">
            Other Zodiac Signs:
          </div>
          <div className="md:hidden">
            <CustomCarousel
              items={signSignList}
              itemWidth={96} // 48 * 4
              gap={16}
              showNavigation={false}
              autoplay={true}
              showDots={false}
              infinite={true}
              showArrows={false}
              renderItem={(sign) => (
                <Link
                  key={sign.id}
                  className="flex flex-col justify-center items-center"
                  to={`/astrology/zodiac-sign/${sign.name}/${encryptId(
                    sign.id
                  )}`}
                >
                  <div className="h-[100px] w-[100px] flex items-center justify-center bg-[#EAD9E5] rounded-full">
                    <img
                      src={sign.img_src}
                      alt={sign.name}
                      className="w-12 h-12"
                    />
                  </div>
                  <div className=" flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-primary">
                      {capitalizeName(sign.name)}
                    </h3>
                    <p className="text-sm text-gray-500">{sign.date}</p>
                  </div>
                </Link>
              )}
            />
          </div>
          {
            <div className="hidden md:grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gapx-4 gap-y-8 mb-10">
              {signSignList?.map((sign, index) => (
                <Link
                  key={index}
                  className="flex flex-col justify-center items-center"
                  to={`/astrology/zodiac-sign/${sign.name}/${encryptId(
                    sign.id
                  )}`}
                >
                  <div className="h-[100px] w-[100px] flex items-center justify-center bg-[#EAD9E5] rounded-full">
                    <img
                      src={sign.img_src}
                      alt={sign.name}
                      className="w-12 h-12"
                    />
                  </div>
                  <div className=" flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-primary">
                      {capitalizeName(sign.name)}
                    </h3>
                    <p className="text-sm text-gray-500">{sign.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          }
        </Card>
      </div>
    </AsyncComponent>
  );
}
