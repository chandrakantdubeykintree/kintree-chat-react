import { useState, useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchableDropdown = forwardRef(
  (
    {
      options,
      value,
      onChange,
      onBlur,
      placeholder = "Select an option",
      error,
      disabled,
      name,
      className,
      searchPlaceholder = "Search...",
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    const selectedOption = options?.find(
      (opt) => opt.id?.toString() === (value?.toString() || ""),
    );

    const filteredOptions = options.filter((option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
      if (!isOpen) {
        setSearchTerm("");
      }
    }, [isOpen]);

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

    const handleSelect = (option) => {
      onChange(option.id);
      setIsOpen(false);
      if (onBlur) onBlur({ target: { name } });
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full justify-between h-12 px-5 rounded-r-full rounded-l-full",
            error && "border-red-500",
            className,
          )}
          disabled={disabled}
          ref={ref}
        >
          <span
            className={
              !selectedOption
                ? "text-muted-foreground line-clamp-1 overflow-hidden text-ellipsis"
                : "line-clamp-1 overflow-hidden text-ellipsis"
            }
          >
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 opacity-50" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </Button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-2xl shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b sticky top-0 bg-background">
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-2 border rounded-r-full rounded-l-full bg-background text-foreground"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto max-h-[200px] pt-2 pb-8 px-4">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      "w-full px-4 py-2 text-left flex items-center justify-between hover:bg-brandPrimary hover:text-white mb-1 rounded-full",
                      value === option.id && "bg-brandPrimary text-white",
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <span>{option.name}</span>
                    {value === option.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-center">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

SearchableDropdown.displayName = "SearchableDropdown";

export default SearchableDropdown;
