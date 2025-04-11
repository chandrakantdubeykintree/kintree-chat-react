import Navbar from "@/components/navbar";

export default function ContentLayout({ children }) {
  return (
    <div className="mx-auto">
      <div className="border-b bg-background sticky top-0 z-20 mb-1 md:mb-4">
        <div className="mx-auto max-w-[1370px]">
          <Navbar />
        </div>
      </div>
      {children}
    </div>
  );
}
