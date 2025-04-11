import * as React from "react";
import { format, isAfter, isBefore, getDaysInMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function CustomDateMonthYearPicker({
  value,
  onChange,
  placeholder = "Select Date",
  className,
  disabled,
  minDate,
  maxDate,
}) {
  // Convert string date to Date object if needed
  const dateValue = value ? new Date(value) : null;
  const [selectedDate, setSelectedDate] = React.useState(
    dateValue || new Date()
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 200 }, (_, i) => currentYear - 150 + i);

  const daysInMonth = getDaysInMonth(selectedDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateChange = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);

    if (isDateInRange(newDate)) {
      setSelectedDate(newDate);
      // Format date as YYYY-MM-DD string for form value
      onChange(format(newDate, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);
    const daysInNewMonth = getDaysInMonth(newDate);
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    setSelectedDate(newDate);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year));
    if (
      newDate.getMonth() === 1 &&
      newDate.getDate() > getDaysInMonth(newDate)
    ) {
      newDate.setDate(getDaysInMonth(newDate));
    }
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    const daysInNewMonth = getDaysInMonth(newDate);
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    setSelectedDate(newDate);
  };

  const isDateInRange = (date) => {
    if (minDate && isBefore(date, new Date(minDate))) return false;
    if (maxDate && isAfter(date, new Date(maxDate))) return false;
    return true;
  };

  const isDateSelected = (day) => {
    if (!dateValue) return false;

    const currentDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    return (
      format(currentDate, "yyyy-MM-dd") === format(dateValue, "yyyy-MM-dd")
    );
  };

  const getDisplayText = () => {
    return dateValue ? format(dateValue, "dd MMMM yyyy") : placeholder;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 rounded-2xl" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
              disabled={
                minDate &&
                isBefore(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - 1
                  ),
                  new Date(minDate)
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              <Select
                value={selectedDate.getMonth().toString()}
                onValueChange={(value) => handleMonthChange(parseInt(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue>{months[selectedDate.getMonth()]}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-[200px] overflow-y-auto no_scrollbar">
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDate.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue>{selectedDate.getFullYear()}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-[200px] overflow-y-auto no_scrollbar">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              disabled={
                maxDate &&
                isAfter(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1
                  ),
                  new Date(maxDate)
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => (
              <Button
                key={day}
                variant={isDateSelected(day) ? "default" : "outline"}
                className={cn(
                  "h-8 w-8 p-0",
                  isDateSelected(day) && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleDateChange(day)}
                disabled={
                  !isDateInRange(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      day
                    )
                  )
                }
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
