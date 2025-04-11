import { PRIVACYDROPDOWN } from "@/constants/dropDownConstants";

export const checkPostAccess = (authorId, privacy, currentUser) => {
  if (!authorId || !currentUser) return false;

  // Default to Global if privacy is not set
  const privacyLevel = privacy || PRIVACYDROPDOWN[0].id;

  // Post author can always view their own post
  if (authorId === currentUser.id) return true;

  switch (privacyLevel) {
    case 1: // Global
      return true;

    case 2: // Family Tree
      return currentUser.family_tree_members?.includes(authorId);

    case 3: // Primary Family
      return currentUser.primary_family_members?.includes(authorId);

    case 4: // Only Me
      return false;

    default:
      return false;
  }
};
