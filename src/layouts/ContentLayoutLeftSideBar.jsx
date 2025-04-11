import LeftSidebar from "@/components/left-sidebar";

export default function ContentLayoutLeftSideBar({ children }) {
  return (
    <main className={`max-w-[1370px] mx-auto px-1`}>
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-88px)] md:h-[calc(100vh-104px)]">
        <div className="hidden md:block md:col-span-3 lg:col-span-3 sticky top-[88px] md:top-[104px] overflow-y-scroll no_scrollbar">
          <LeftSidebar />
        </div>

        <div className="col-span-12 md:col-span-9 lg:col-span-9 overflow-y-scroll no_scrollbar relative">
          {children}
        </div>
      </div>
    </main>
  );
}
