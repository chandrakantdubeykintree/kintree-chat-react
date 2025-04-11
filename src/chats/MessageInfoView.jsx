// components/MessageInfoView.jsx
import React from "react";
import { format } from "date-fns";
import { CheckCheck, Clock } from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "Invalid Date";
  }
};

const MessageInfoView = ({ message }) => {
  if (!message) return <p>No message data available.</p>;

  // Determine status based on timestamps
  const getStatusText = () => {
    if (message.read_at) return `Read (${formatDate(message.read_at)})`;
    if (message.delivered_at)
      return `Delivered (${formatDate(message.delivered_at)})`;
    // Assuming presence means sent if it has an ID
    if (message.id) return `Sent (${formatDate(message.created_at)})`;
    return "Pending"; // Or handle this case if you have pending state
  };

  const getStatusIcon = () => {
    if (message.read_at)
      return <CheckCheck size={18} className="text-blue-500" />;
    if (message.delivered_at)
      return <CheckCheck size={18} className="text-muted-foreground" />;
    if (message.id)
      return (
        <CheckCheck size={18} className="text-muted-foreground opacity-50" />
      ); // Single check for sent?
    return <Clock size={18} className="text-muted-foreground" />;
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Display message content preview? */}
      {/* <p className="p-2 bg-muted rounded break-words">"{message.message}"</p> */}
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>

      {/* Optionally show delivered time even if read */}
      {message.delivered_at && !message.read_at && (
        <div className="flex items-center space-x-2 pl-7 text-muted-foreground">
          {" "}
          {/* Indent */}
          <span>Delivered: {formatDate(message.delivered_at)}</span>
        </div>
      )}
      <div className="flex items-center space-x-2 pl-7 text-muted-foreground">
        {" "}
        {/* Indent */}
        <span>Sent: {formatDate(message.created_at)}</span>
      </div>

      {/* Add Read By / Delivered To list for groups later */}
    </div>
  );
};

export default MessageInfoView;
