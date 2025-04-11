import { useState, useEffect, useRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";

const YearSelect = forwardRef(
  (
    {
      value,
      onChange,
      startYear = 1900,
      endYear = new Date().getFullYear() + 10,
      placeholder = "Select Year",
      disabled,
      name,
      onBlur,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    const years = Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => endYear - i
    );

    const filteredYears = years.filter((year) =>
      year.toString().includes(searchTerm)
    );

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleYearSelect = (year) => {
      onChange(year.toString()); // Convert to string for consistency
      setIsOpen(false);
      onBlur?.(); // Trigger onBlur for form validation
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full justify-between h-12 px-5 rounded-r-full rounded-l-full",
            className
          )}
          disabled={disabled}
        >
          <span className={!value ? "text-muted-foreground" : ""}>
            {value || placeholder}
          </span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4 opacity-50" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          )}
        </Button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-2xl shadow-lg max-h-60 p-2 overflow-auto">
            <input
              type="text"
              className="w-full p-2 border rounded-full bg-background text-foreground my-2 shadow-sm px-4 h-10 lg:h-12"
              placeholder="Search year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="py-1 bg-background text-foreground">
              {filteredYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={cn(
                    "w-full px-4 py-2 text-left hover:bg-brandPrimary hover:text-white rounded-md",
                    value === year.toString() && "bg-brandPrimary/10"
                  )}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
        <input
          type="hidden"
          name={name}
          value={value || ""}
          ref={ref}
          onChange={() => {}}
        />
      </div>
    );
  }
);

YearSelect.displayName = "YearSelect";

export default YearSelect;
