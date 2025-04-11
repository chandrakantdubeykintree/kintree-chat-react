import AsyncComponent from "@/components/async-component";
import SunSignList from "@/components/sun-sign-list";
import { Card } from "@/components/ui/card";
import { CustomTabPanel, CustomTabs } from "@/components/ui/custom-tabs";
import ZodiacSignList from "@/components/zodiac-sign";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

export default function Astrology() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "daily-horoscope";

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  const tabs = [
    { value: "daily-horoscope", label: t("daily_horoscope") },
    { value: "zodiac-sign", label: t("zodiac_sign") },
  ];

  return (
    <AsyncComponent>
      <div className="grid grid-cols-1">
        <div className="sticky top-0 bg-background z-20 px-4 pt-4 rounded-2xl">
          <CustomTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            variant="underline"
          />
        </div>
        <CustomTabPanel value="daily-horoscope" activeTab={activeTab}>
          <SunSignList />
        </CustomTabPanel>
        <CustomTabPanel value="zodiac-sign" activeTab={activeTab}>
          <ZodiacSignList />
        </CustomTabPanel>
        <Card className="rounded-2xl p-6 mt-4">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="h-[18px] font-semibold">{t("astrology")}</h2>
            <p className="text-sm text-[#5E5F60]">
              Discover Your Daily Path with Kintree Astrology! Your stars have a
              story – let Kintree help you read it.
            </p>
            <p className="text-sm text-[#5E5F60]">
              At Kintree, we bring you online horoscope readings that align with
              your zodiac sign and guide you through life’s daily adventures.
            </p>
            <p className="text-sm text-[#5E5F60]">
              Whether you're looking for insight into your day, week, or month,
              our Horoscope Readings offer accurate forecasts that help you stay
              aligned with the universe.
            </p>
            <p className="text-sm text-[#5E5F60]">
              Get updates on your lucky colour, lucky number, lucky gemstone,
              and more; tailored to your zodiac sign. Stay ahead with
              predictions about careers, relationships, health, and finances and
              meaningful insights to help you make confident decisions every
              day.
            </p>
            <p className="text-sm text-[#5E5F60]">
              Whether you're a fiery Aries or a dreamy Pisces, Kintree Astrology
              offers an intuitive and enlightening experience. Start your day
              the right way; with a quick glance at what the stars have in store
              for you.
            </p>
          </div>
        </Card>
      </div>
    </AsyncComponent>
  );
}
