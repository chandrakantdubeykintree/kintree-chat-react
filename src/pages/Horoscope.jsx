import AsyncComponent from "@/components/async-component";
import { Card } from "@/components/ui/card";
import { CustomTabPanel, CustomTabs } from "@/components/ui/custom-tabs";
import { decryptId, encryptId } from "@/utils/encryption";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { signSignList } from "@/constants/sunsignList";
import { addDays, format, subDays } from "date-fns";
import { capitalizeName } from "@/utils/stringFormat";
import { useDailyHoroscope } from "@/hooks/useAstro";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CustomCarousel from "@/components/custom-carousel";
import EmptyState from "@/components/empty-state";

const LoadingState = () => {
  return (
    <div className="grid grid-cols-1 space-y-4 mb-4">
      <div className="bg-background px-4 pt-4 rounded-2xl">
        <div className="h-10 flex gap-4 border-b">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-full">
              <div className="h-full px-4 py-2">
                <div className="w-20 h-4 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Card>
        {/* Zodiac Circle Skeleton */}
        <div className="bg-[url('/astrology-img/astrolog-bg.png')] bg-cover bg-center h-[200px] md:h-[300px] rounded-2xl relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[80px] w-[80px] md:h-[115px] md:w-[115px] bg-muted animate-pulse rounded-full" />
          </div>
          {/* Skeleton spots for info */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-20 h-8 bg-muted/50 animate-pulse rounded"
              style={{
                top: i < 2 ? "15%" : i < 4 ? "50%" : "85%",
                left: i % 2 === 0 ? "8%" : "auto",
                right: i % 2 === 1 ? "8%" : "auto",
              }}
            />
          ))}
        </div>

        {/* Predictions Skeleton */}
        <div className="p-4 space-y-4">
          <div className="w-48 h-6 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="w-full h-4 bg-muted animate-pulse rounded" />
            <div className="w-3/4 h-4 bg-muted animate-pulse rounded" />
          </div>

          {/* Accordion Skeleton */}
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-muted animate-pulse rounded-2xl"
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default function Horoscope() {
  const { id: encryptedId, sunsign } = useParams();
  const id = decryptId(encryptedId);

  const sunSignInfo = signSignList?.find(
    (item) => item.name === sunsign?.toLowerCase()
  );

  const scrollableRef = useRef(null);

  const { dailyHoroscope, isLoading, isError, error } = useDailyHoroscope(
    sunsign,
    id
  );
  const today = new Date();

  const { t } = useTranslation();
  const tabs = [
    { value: "yesterday", label: t("yesterday") },
    { value: "today", label: t("today") },
    { value: "tomorrow", label: t("tomorrow") },
  ];
  const [activeTab, setActiveTab] = useState("today");
  const tabs2 = [
    { value: "weekly_horoscope", label: t("weekly_horoscope") },
    { value: "monthly_horoscope", label: t("monthly_horoscope") },
  ];
  const [activeTab2, setActiveTab2] = useState("weekly_horoscope");

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

  if (isError) {
    return (
      <AsyncComponent>
        <EmptyState
          title={t("error_occurred")}
          message={error?.message || t("error_loading_horoscope")}
          message2={t("please_try_again_later")}
          imgSrc="/illustrations/no-horoscope.png"
        />
      </AsyncComponent>
    );
  }
  if (!isLoading && !dailyHoroscope) {
    return (
      <AsyncComponent>
        <EmptyState
          title={t("error_occurred")}
          message={error?.message || t("error_loading_horoscope")}
          message2={t("please_try_again_later")}
          imgSrc="/illustrations/no-horoscope.png"
        />
      </AsyncComponent>
    );
  }
  const getPredictionContent = (tab) => {
    if (isLoading) {
      return <Skeleton className="h-20 w-full" />;
    }
    if (tab === "Monthly") {
      return (
        dailyHoroscope?.predictions?.[tab]
          .split("\n")
          .map((paragraph, index) => {
            // Handle case where days are in a single paragraph
            if (
              paragraph.includes("Standout days:") &&
              paragraph.includes("Challenging days:")
            ) {
              const parts = paragraph.split(
                /(Standout days:|Challenging days:)/
              );
              return (
                <>
                  {/* Regular text before days info */}
                  {parts[0] && (
                    <p key={`${index}-text`} className="mt-2">
                      {parts[0].trim()}
                    </p>
                  )}
                  {/* Standout days */}
                  <p key={`${index}-standout`} className="font-bold mt-2">
                    {parts[1]}
                    {parts[2]}
                  </p>
                  {/* Challenging days */}
                  <p key={`${index}-challenging`} className="font-bold mt-2">
                    {parts[3]}
                    {parts[4]}
                  </p>
                </>
              );
            }
            // Handle case where days are in separate paragraphs
            else if (
              paragraph.includes("Standout days:") ||
              paragraph.includes("Challenging days:")
            ) {
              return (
                <p key={index} className="font-bold mt-2">
                  {paragraph}
                </p>
              );
            }

            // Handle regular paragraphs
            const cleanedParagraph = paragraph
              .replace(/Learn More.*$/, "")
              .trim();

            return cleanedParagraph ? (
              <p key={index} className="mt-2">
                {cleanedParagraph}
              </p>
            ) : null;
          }) || "No prediction available"
      );
    }
    if (tab === "Weekly") {
      return (
        dailyHoroscope?.predictions?.[tab]
          .split("\n")
          .map((paragraph, index) => {
            const cleanedParagraph = paragraph
              .replace(/Learn More.*$/, "")
              .trim();
            return (
              <p key={index} className="mt-2">
                {cleanedParagraph}
              </p>
            );
          }) || "No prediction available"
      );
    }
    const predictionText =
      dailyHoroscope?.predictions?.[tab] || "No prediction available";
    const cleanedText = predictionText.replace(/Learn More.*$/, "").trim();
    return cleanedText;
  };

  function getZodiacSpiritColor(colorName) {
    const zodiacColorMap = {
      // Fire Signs
      aries: "#FF0000", // Red
      leo: "#FFD700", // Gold
      sagittarius: "#800080", // Purple

      // Earth Signs
      taurus: "#90EE90", // Light Green
      virgo: "#964B00", // Brown
      capricorn: "#808080", // Grey/Silver

      // Air Signs
      gemini: "#FFFF00", // Yellow
      libra: "#FFC0CB", // Pink
      aquarius: "#00FFFF", // Electric Blue

      // Water Signs
      cancer: "#FFFFFF", // White/Silver
      scorpio: "#000000", // Black
      pisces: "#98FB98", // Sea Green

      // Alternative/Secondary Colors
      red: "#FF0000",
      gold: "#FFD700",
      purple: "#800080",
      green: "#90EE90",
      brown: "#964B00",
      grey: "#808080",
      yellow: "#FFFF00",
      pink: "#FFC0CB",
      blue: "#00FFFF",
      white: "#FFFFFF",
      black: "#000000",
      "sea green": "#98FB98",
    };

    // Convert color name to lowercase and remove spaces
    const normalizedColor = colorName?.toLowerCase().replace(/\s+/g, "") || "";

    // Return the hex code or a default color if not found
    return zodiacColorMap[normalizedColor] || "#CCCCCC";
  }

  const renderAccordionContent = (type) => {
    if (isLoading) {
      return <Skeleton className="h-20 w-full" />;
    }

    // Remove "Learn more" from the prediction text
    const predictionText =
      dailyHoroscope?.predictions?.[type] || "No prediction available";
    const cleanedText = predictionText.replace(/Learn More.*$/, "").trim();

    return (
      <div className="flex flex-col gap-4 pb-6">
        <p className="text-white px-4 text-lg font-normal">{cleanedText}</p>
      </div>
    );
  };

  const CircularZodiacInfo = ({
    sunSignInfo,
    dailyHoroscope,
    isLoading,
    getZodiacSpiritColor,
  }) => {
    return (
      <div className="bg-[url('/astrology-img/astrolog-bg.png')] bg-cover bg-center h-[200px] md:h-[300px] rounded-2xl relative">
        {/* Main container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Elements Layout */}
          <div className="absolute w-full h-full p-4">
            {/* Top Element */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center">
              <div className="text-lg md:text-xl text-white font-semibold line-clamp-1">
                {dailyHoroscope?.zodiac_sign?.date}
              </div>
            </div>

            {/* Top Right Element */}
            <div className="absolute top-[15%] right-4 md:right-8 text-center">
              <div className="text-lg text-white font-normal">Element</div>
              <div className="text-lg text-white font-semibold line-clamp-1">
                {dailyHoroscope?.zodiac_sign?.element}
              </div>
            </div>

            {/* Bottom Right Element */}
            <div className="absolute bottom-[15%] right-4 md:right-8 text-center">
              <div className="text-lg text-white font-normal">Planet</div>
              <div className="text-lg text-white font-semibold line-clamp-1">
                {dailyHoroscope?.zodiac_sign?.ruling_planet}
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
              <div className="text-lg text-white font-normal">Color</div>
              <div className="flex items-center justify-center mt-1">
                <div
                  style={{
                    backgroundColor: getZodiacSpiritColor(
                      dailyHoroscope?.zodiac_sign?.name
                    ),
                  }}
                  className="w-5 h-5 rounded-full border"
                />
              </div>
            </div>

            {/* Top Left Element */}
            <div className="absolute top-[15%] left-4 md:left-8 text-center">
              <div className="text-lg text-white font-normal">Love Match</div>
              <div className="text-lg text-white font-semibold line-clamp-1">
                {dailyHoroscope?.zodiac_sign?.top_love_matches}
              </div>
            </div>

            {/* Center Image */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-[80px] w-[80px] md:h-[115px] md:w-[115px] flex items-center justify-center bg-[#EAD9E5] rounded-full z-10">
                {isLoading ? (
                  <Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-full" />
                ) : (
                  <img
                    src={sunSignInfo.img_src}
                    alt={sunSignInfo.name}
                    className="w-12 h-12 md:w-16 md:h-16"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AsyncComponent>
      <div className="grid grid-cols-1 space-y-4 mb-4" ref={scrollableRef}>
        <div className="bg-background px-4 pt-4 rounded-2xl">
          <CustomTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>
        <Card>
          <CircularZodiacInfo
            sunSignInfo={sunSignInfo}
            dailyHoroscope={dailyHoroscope}
            isLoading={isLoading}
            getZodiacSpiritColor={getZodiacSpiritColor}
          />

          {/* Daily Predictions */}
          {tabs.map((tab) => (
            <CustomTabPanel
              key={tab.value}
              value={tab.value}
              activeTab={activeTab}
            >
              <div className="grid grid-cols-1 gap-4 p-4">
                <div className="text-[20px] font-semibold text-primary">
                  {t(`${tab.value}_horoscope`)} (
                  {tab.value === "yesterday"
                    ? format(subDays(today, 1), "EEE, dd MMM")
                    : tab.value === "today"
                    ? format(today, "EEE, dd MMM")
                    : format(addDays(today, 1), "EEE, dd MMM")}
                  )
                </div>

                <div className="text-lg" key={tab.value}>
                  {getPredictionContent(tab.value)}
                </div>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-4"
                  defaultValue="health"
                >
                  {["health", "love", "career"].map((type) => (
                    <AccordionItem
                      key={type}
                      value={type}
                      className={`border-none ${
                        type === "health"
                          ? "bg-[#0AA808]"
                          : type === "love"
                          ? "bg-[#E75858]"
                          : "bg-[#58B4E7]"
                      } rounded-2xl`}
                    >
                      <AccordionTrigger className="text-lg font-medium text-white px-4 [&[data-state=open]>svg]:text-white [&[data-state=closed]>svg]:text-white">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <img
                              src={`/astrology-img/${type}.svg`}
                              className="h-5 w-5"
                            />
                            {t(type)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {renderAccordionContent(type)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </CustomTabPanel>
          ))}
        </Card>
      </div>
      <div className="grid grid-cols-1 space-y-4 mb-4">
        <div className="bg-background px-4 pt-4 rounded-2xl">
          <CustomTabs
            tabs={tabs2}
            activeTab={activeTab2}
            onChange={setActiveTab2}
            variant="underline"
          />
        </div>
        <Card className="border border-primary bg-[#FAF2F8] p-4 md:p-6 pt-0 md:pt-0">
          {tabs2.map((tab) => (
            <CustomTabPanel
              key={tab.value}
              value={tab.value}
              activeTab={activeTab2}
            >
              <div className="text-[18px] font-semibold dark:text-black">
                {capitalizeName(sunsign)}&nbsp;
                {t(tab.value)}
              </div>
              <div className="text-lg mt-4">
                {getPredictionContent(
                  tab.value === "weekly_horoscope" ? "Weekly" : "Monthly"
                )}
              </div>
            </CustomTabPanel>
          ))}
        </Card>
        <Card className="py-6">
          <div className="text-[20px] font-bold text-primary mb-6 px-6">
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
                  to={`/astrology/horoscope/${sign.name}/${encryptId(sign.id)}`}
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
                  to={`/astrology/horoscope/${sign.name}/${encryptId(sign.id)}`}
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
