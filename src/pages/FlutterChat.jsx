import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { tokenService } from "../services/tokenService";

import { toast } from "react-hot-toast";
import ChatFlutter from "./ChatFlutter";
import GlobalSpinner from "@/components/global-spinner";

export default function FlutterChat() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const { mobile } = useSearchParams();

  useEffect(() => {
    if (token) {
      tokenService.setLoginToken(token);

      if (tokenService.isLoginTokenValid()) {
        setIsValidToken(true);
      } else {
        toast.error("Invalid or expired token");
      }
    } else {
      toast.error("No token provided");
    }
    setIsLoading(false);
  }, [token, navigate]);

  if (!isValidToken) {
    return null;
  }

  if (isLoading) {
    return <GlobalSpinner />;
  }

  if (!isValidToken) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <img
          src="/illustrations/unauthorized.svg"
          alt="Unauthorized"
          className="w-64 h-64 mb-8"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 text-center max-w-md">
          You are not authorized to access this chat. Please check your link or
          contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <main className={`max-w-[1370px] mx-auto`}>
        <div className="grid grid-cols-12 gap-4 h-[100vh]">
          <div
            className={`
              col-span-12 
              overflow-y-auto relative
              h-full
            `}
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <ChatFlutter
              isFlutter={true}
              onViewChange={(isChannelList) => {
                setSearchParams({ mobile: isChannelList ? "true" : "false" });
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
