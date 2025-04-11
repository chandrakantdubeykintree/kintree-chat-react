import { useState } from "react";
import ImageScroller from "../components/image-scroller";
import KintreeTermsDialog from "../components/kintree-term-dialog";

import { Outlet } from "react-router";

export default function AuthLayout() {
  const [openTerms, setOpenTerms] = useState({
    isOpen: false,
    type: "terms",
    url: "",
  });
  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-dark-body h-[120vh]">
          <div className="relative">
            <ImageScroller />
            <div
              className="absolute inset-0 bg-black opacity-60 transition-all duration-300 ease-in-out"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="relative z-10">
          <Outlet context={{ setOpenTerms }} />
        </div>
      </div>
      {openTerms && (
        <KintreeTermsDialog
          isOpen={openTerms.isOpen}
          onClose={() => setOpenTerms({ isOpen: false, type: "", url: "" })}
          type={openTerms.type}
          url={openTerms.url}
        />
      )}
    </>
  );
}
