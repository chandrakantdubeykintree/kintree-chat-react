import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useCreateMergeRequest } from "@/hooks/useMergeTree";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/utils/stringFormat";
import CustomScrollArea from "./ui/custom-scroll-area";
import toast from "react-hot-toast";

export default function MergeRequestForm({
  isOpen,
  onClose,
  userId,
  familyMembers,
  mergeRelationType,
  setIsMergeRequestSent,
  currentUser,
  requesterData,
  profile,
}) {
  const { mutate: createRequest, isLoading } = useCreateMergeRequest();

  const getRelationLabel = (value) => {
    const relations = {
      1: "Parent",
      2: "Partner",
      3: "Sibling",
      4: "Children",
    };
    return relations[value] || "";
  };
  const [formData, setFormData] = useState({
    user_id: userId,
    requestor_id_on_receiver_tree: null,
    relation_type: "",
  });

  const getFilteredFamilyMembers = () => {
    if (!familyMembers || !formData.relation_type || !currentUser) return [];

    switch (formData.relation_type) {
      case 1: // Parent
        // Show members who have the current user as their father or mother
        return familyMembers.filter(
          (member) =>
            member.id === currentUser.fid || member.id === currentUser.mid
        );

      case 2: // Partner
        // If user has no pid, return empty array
        // if (!currentUser.pids || currentUser.pids.length === 0) return [];
        // // Otherwise show only the pid member
        // return familyMembers.filter((member) =>
        //   currentUser.pids.includes(member.id)
        // );
        if (
          profile?.basic_info?.gender &&
          currentUser?.basic_info?.gender &&
          profile?.basic_info?.gender !== currentUser.basic_info?.gender &&
          (!currentUser.pids || currentUser.pids.length === 0)
        ) {
          return familyMembers.filter((member) =>
            currentUser.pids.includes(member.id)
          );
        }
        return [];

      case 3: // Sibling
        // Show members with same fid and mid as current user
        return familyMembers.filter(
          (member) =>
            member.id !== currentUser.id && // Exclude self
            member.fid === currentUser.fid &&
            member.mid === currentUser.mid
        );

      case 4: // Children
        return familyMembers.filter(
          (member) =>
            member.fid === currentUser.id || member.mid === currentUser.id
        );

      default:
        return [];
    }
  };
  const isPartnerSelectionDisabled =
    formData.relation_type === 2 &&
    // Disable if either user has no gender specified
    (!profile?.basic_info?.gender ||
      !currentUser?.basic_info?.gender ||
      // Disable if genders are the same
      profile?.basic_info?.gender === currentUser?.basic_info?.gender ||
      // Disable if target user already has a partner
      (currentUser?.pids && currentUser.pids.length > 0));

  // Update the relation type Select to disable partner option if needed
  const handleRelationTypeChange = (value) => {
    const numValue = Number(value);
    if (numValue === 2) {
      if (!profile?.basic_info?.gender || !currentUser?.basic_info?.gender) {
        toast.error("Both users must have gender specified");
        return;
      }
      if (profile?.basic_info?.gender === currentUser?.basic_info?.gender) {
        toast.error("Partner requests can only be sent to opposite gender");
        return;
      }
      // if (currentUser?.pids && currentUser.pids.length > 0) {
      //   toast.error("This person already has a partner");
      //   return;
      // }
    }
    setFormData({
      ...formData,
      relation_type: numValue,
      requestor_id_on_receiver_tree: null,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.relation_type) {
      toast.error("Please select a relation type");
      return;
    }

    createRequest(formData, {
      onSuccess: () => {
        setIsMergeRequestSent(true);
        // toast.success("Merge request created successfully!");
        onClose();
      },
      onError: (error) => {
        console.error("Form submission failed:", error);
        toast.error(
          error?.response?.data?.message || "Failed to send merge request"
        );
      },
    });
  };

  const isFormValid = Boolean(formData.relation_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] w-[425px] rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>Send Tree Merge Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relation_type">Relation Type</Label>
            <Select
              value={formData.relation_type?.toString()}
              onValueChange={handleRelationTypeChange}
            >
              <SelectTrigger className="w-full h-10 md:h-12 rounded-full">
                <SelectValue
                  placeholder={
                    formData.relation_type
                      ? getRelationLabel(formData.relation_type)
                      : "Select relation type"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                {mergeRelationType?.map((relation) => (
                  <SelectItem
                    key={relation.id}
                    value={relation.id.toString()}
                    className="h-10 rounded-2xl cursor-pointer"
                    disabled={relation.id === 2 && isPartnerSelectionDisabled}
                  >
                    {relation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Are you in reciever's family tree?</Label>
            <Select
              value={formData.requestor_id_on_receiver_tree?.toString()}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  requestor_id_on_receiver_tree: Number(value),
                })
              }
              disabled={
                !formData.relation_type ||
                getFilteredFamilyMembers?.()?.length === 0
              } // Add this line
            >
              <SelectTrigger className="w-full h-10 md:h-12 rounded-full">
                <SelectValue placeholder="Select family member" />
              </SelectTrigger>
              <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                <CustomScrollArea maxHeight="200px">
                  {getFilteredFamilyMembers?.()?.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id.toString()}
                      className="h-16 rounded-2xl cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={member.profile_pic_url}
                            alt={member.first_name}
                          />
                          <AvatarFallback>
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.first_name}&nbsp;{member.last_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {member.relation}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </CustomScrollArea>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="rounded-full"
            >
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
