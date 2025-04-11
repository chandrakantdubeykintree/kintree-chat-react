import { useEffect } from "react";
import { useLocation } from "react-router";
import routeTitles from "./constants/routeTitles";

const RouteNameDisplay = () => {
  const location = useLocation();
  const routeName =
    routeTitles["/" + location.pathname.split("/")[1]] || "Not Found";

  useEffect(() => {
    document.title = `Kintree | ${routeName}`;
  }, [routeName]);

  return null;
};

export default RouteNameDisplay;
