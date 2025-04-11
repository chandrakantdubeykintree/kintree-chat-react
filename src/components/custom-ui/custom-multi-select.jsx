import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomInput from "./custom-input";

export default function CustomMultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  icon: Icon,
  className,
  error,
  disabled,
  item_name,
  searchPlaceholder = "Search...",
}) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedItems = safeOptions.filter((option) =>
    value.includes(option.value)
  );

  const handleSelect = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((val) => val !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    // Select all filtered options that aren't already selected
    const newValues = [
      ...new Set([...value, ...filteredOptions.map((option) => option.value)]),
    ];
    onChange(newValues);
  };

  const handleRemoveAll = () => {
    // Remove all filtered options from selection
    const newValues = value.filter(
      (val) => !filteredOptions.find((option) => option.value === val)
    );
    onChange(newValues);
  };

  const removeItem = (optionValue, e) => {
    e.stopPropagation();
    onChange(value.filter((val) => val !== optionValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            "bg-background",
            "focus:ring-0",
            error && "border-red-500",
            className,
            "rounded-full"
          )}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className={cn(!value.length && "text-muted-foreground")}>
              {value.length > 0
                ? `${value.length} ${item_name ? item_name : "item"}${
                    value.length !== 1 ? "s" : ""
                  } selected`
                : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl"
        align="start"
      >
        <div className="flex flex-col p-2 gap-2">
          <div className="w-full">
            <CustomInput
              icon={<Search className="h-4 w-4 shrink-0 opacity-50" />}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full"
            />
          </div>

          {/* Select/Remove All Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              onClick={handleSelectAll}
              disabled={filteredOptions.every((option) =>
                value.includes(option.value)
              )}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              onClick={handleRemoveAll}
              disabled={filteredOptions.every(
                (option) => !value.includes(option.value)
              )}
            >
              Remove All
            </Button>
          </div>

          {/* Selected Items Section */}
          {selectedItems.length > 0 && (
            <div className="border-t pt-2">
              <div className="text-sm text-muted-foreground mb-2">
                Selected Items ({selectedItems.length})
              </div>
              <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-2">
                {selectedItems.map((item) => (
                  <Badge
                    key={item.value}
                    variant="secondary"
                    className="flex items-center gap-1 max-w-full"
                  >
                    <span className="truncate">{item.label}</span>
                    <X
                      className="h-3 w-3 shrink-0 cursor-pointer hover:text-destructive"
                      onClick={(e) => removeItem(item.value, e)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="border-t pt-2">
            <div className="text-sm text-muted-foreground mb-2">
              Available Options ({filteredOptions.length})
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-md hover:bg-accent",
                      value.includes(option.value) && "bg-accent"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="truncate mr-2">{option.label}</span>
                    {value.includes(option.value) && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-2 px-2 text-sm text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
