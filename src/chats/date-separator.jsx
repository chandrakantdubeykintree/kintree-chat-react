// components/DateSeparator.jsx
import React from "react";

const DateSeparator = ({ date }) => {
  return (
    <div className="flex justify-center my-3">
      {" "}
      {/* Margin top/bottom */}
      <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full border shadow-sm">
        {date}
      </span>
    </div>
  );
};

export default DateSeparator;
