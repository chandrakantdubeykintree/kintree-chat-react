import ProfileCard from "./profile-card";
import SecondaryNavigation from "./secondary-navigation";

export default function LeftSideBar() {
  return (
    <div className="grid gap-6">
      <ProfileCard />
      <SecondaryNavigation />
    </div>
  );
}
