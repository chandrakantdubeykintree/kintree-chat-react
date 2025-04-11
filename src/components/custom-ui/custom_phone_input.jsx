import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomPhoneInput = React.forwardRef(
  (
    {
      className,
      label,
      error,
      height = "h-10",
      width = "w-full",
      containerClassName,
      countries,
      setCountryCode,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [selectedCountry, setSelectedCountry] = useState(countries[2]);
    useEffect(() => {
      if (setCountryCode) {
        setCountryCode(selectedCountry.phone_code);
      }
    }, []);
    return (
      <div
        className={cn("flex flex-col gap-1.5 rounded-full", containerClassName)}
      >
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-foreground"
          >
            {t(label)}
          </label>
        )}

        <div className={cn("relative", width)}>
          <Select
            value={selectedCountry.iso2}
            onValueChange={(value) => {
              const country = countries.find((c) => c.iso2 === value);
              setSelectedCountry(country);
              if (setCountryCode) {
                setCountryCode(country.phone_code);
              }
            }}
          >
            <SelectTrigger
              className={cn(
                "absolute left-0 top-0 z-10 flex w-[90px] items-center gap-1 rounded-l-full border-0 pr-0",
                "focus:outline-none focus:ring-0 focus:ring-offset-0",
                "hover:border-0",
                height
              )}
            >
              <SelectValue>
                <div className="flex items-center gap-2">
                  <img
                    src={selectedCountry.flag_url}
                    alt={selectedCountry.name}
                    className="h-4 w-6 object-cover"
                  />
                  <span className="text-sm">{selectedCountry.phone_code}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem
                  key={country.id}
                  value={country.iso2}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={country.flag_url}
                      alt={country.name}
                      className="h-4 w-6 object-cover"
                    />
                    <span className="text-sm">{country.phone_code}</span>
                    <span className="text-sm text-muted-foreground">
                      {country.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="absolute left-[95px] top-[15%] h-[70%] w-[1px] bg-primary " />
          <input
            ref={ref}
            type="tel"
            className={cn(
              // Base styles
              "flex w-full rounded-full border border-primary bg-background pl-[105px] pr-1 py-1",
              "text-md ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              // Focus styles
              "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0",
              "focus:border-primary",
              // Hover styles
              "hover:border-primary/80",
              // Error styles
              error &&
                "!border-destructive focus:!ring-destructive focus:!border-destructive",
              // Additional styles
              height,
              className
            )}
            {...props}
            maxLength={12}
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">{t(error.message)}</p>
        )}
      </div>
    );
  }
);

CustomPhoneInput.displayName = "CustomPhoneInput";

export { CustomPhoneInput };
