import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Edit } from "lucide-react";
import { getInitials } from "@/utils/stringFormat";

export default function ProfileImageUpload({
  value,
  onChange,
  firstName,
  lastName,
  imgSrc,
}) {
  const [preview, setPreview] = useState(() => imgSrc || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-brandPrimary">
          {!preview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-500" />
            </div>
          )}
          <AvatarImage src={preview || value} />
          <AvatarFallback>
            {getInitials(firstName)} {getInitials(lastName)}
          </AvatarFallback>
        </Avatar>
        <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
          <Edit className="w-6 h-6 text-white" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>
      </div>
    </div>
  );
}
