import { cn } from "@/lib/utils";

export function CustomTabs({ tabs, activeTab, onChange, variant = "boxed" }) {
  if (variant === "underline") {
    return (
      <div className="w-full">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all border-b-2",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-primary hover:border-primary",
                tab.count && "flex items-center gap-2"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    activeTab === tab.value
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex space-x-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
              activeTab === tab.value
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  activeTab === tab.value
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CustomTabPanel({ children, value, activeTab }) {
  return activeTab === value ? <div className="mt-4">{children}</div> : null;
}
