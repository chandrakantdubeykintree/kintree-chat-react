const CustomScrollArea = ({
  className = "",
  children,
  maxHeight = "200px",
}) => {
  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{
        maxHeight,
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
      }}
    >
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: transparent;
        }
      `}</style>
      {children}
    </div>
  );
};

export default CustomScrollArea;
