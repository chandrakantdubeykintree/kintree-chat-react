import { useLocation } from "react-router";
import ForeroomRight from "./foreroom-right";
import FamilyMemberRight from "./family-member-right";
// import ChatsSidebar from "./chats-sidebar";

export default function RightSidebar() {
  const { pathname } = useLocation();
  function getRightSidebar() {
    switch (pathname.split("/")[1]) {
      case "foreroom":
        return <ForeroomRight />;
      case "family-member":
        return <FamilyMemberRight />;
      case "kintree-member":
        return <FamilyMemberRight />;
      // return null;
      case "notifications":
        return <ForeroomRight />;
      case "createpost":
        return <ForeroomRight />;
      case "viewpost":
        return <ForeroomRight />;
      case "create-event":
        return <ForeroomRight />;
      case "viewpoll":
        return <ForeroomRight />;
      case "editpost":
        return <ForeroomRight />;
      case "createpoll":
        return <ForeroomRight />;
      case "tree-merge-request":
        return <FamilyMemberRight />;
      case "astrology":
        return <FamilyMemberRight />;
      case "horoscope":
        return <FamilyMemberRight />;
      case "zodiac-sign":
        return <FamilyMemberRight />;
      default:
        return null;
    }
  }
  return <div>{getRightSidebar()}</div>;
}
