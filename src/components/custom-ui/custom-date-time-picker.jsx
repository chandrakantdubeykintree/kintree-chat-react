import * as React from "react";
import {
  format,
  isAfter,
  isBefore,
  getDaysInMonth,
  setHours,
  setMinutes,
} from "date-fns";
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

const CustomDateTimePicker = React.forwardRef(
  (
    {
      value,
      onChange,
      placeholder = "Select Date & Time",
      className,
      error,
      disabled,
      minDate,
      maxDate,
    },
    ref
  ) => {
    const [selectedDate, setSelectedDate] = React.useState(value || new Date());
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
    const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const daysInMonth = getDaysInMonth(selectedDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handleDateChange = (day) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(day);
      if (isDateInRange(newDate)) {
        setSelectedDate(newDate);
        onChange?.(newDate);
      }
    };

    const handleTimeChange = (type, value) => {
      const newDate = new Date(selectedDate);
      if (type === "hour") {
        newDate.setHours(value);
      } else {
        newDate.setMinutes(value);
      }
      setSelectedDate(newDate);
      onChange?.(newDate);
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
      const currentDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day
      );

      return (
        value &&
        format(currentDate, "yyyy-MM-dd") === format(value, "yyyy-MM-dd")
      );
    };

    const getButtonStyles = (day) => {
      const currentDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day
      );

      return isDateSelected(day) ? "bg-primary text-primary-foreground" : "";
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd MMM yyyy HH:mm") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 rounded-2xl" align="start">
          <div className="space-y-1">
            {/* Date Selection */}
            <div className="space-y-4">
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
                    onValueChange={(value) =>
                      handleMonthChange(parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        {months[selectedDate.getMonth()]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
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
                    <SelectTrigger className="w-[100px]">
                      <SelectValue>{selectedDate.getFullYear()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
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
                    className={cn("h-8 w-8 p-0", getButtonStyles(day))}
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

            {/* Time Selection */}
            <div className="flex gap-4 pt-1">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Hour</label>
                <Select
                  value={selectedDate.getHours().toString()}
                  onValueChange={(value) =>
                    handleTimeChange("hour", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {selectedDate.getHours().toString().padStart(2, "0")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Minute</label>
                <Select
                  value={selectedDate.getMinutes().toString()}
                  onValueChange={(value) =>
                    handleTimeChange("minute", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {selectedDate.getMinutes().toString().padStart(2, "0")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

CustomDateTimePicker.displayName = "CustomDateTimePicker";

export default CustomDateTimePicker;
