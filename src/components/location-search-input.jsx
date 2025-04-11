import { forwardRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import AsyncComponent from "./async-component";
import GoogleAutocomplete from "react-google-autocomplete";

export const LocationSearchInput = forwardRef(
  ({ name, value, onChange, onBlur, className, placeholder, error }, ref) => {
    return (
      <AsyncComponent>
        <div className="relative">
          <div className="relative">
            <GoogleAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              onPlaceSelected={(place) => {
                onChange(place.name + " " + place.formatted_address);
              }}
              defaultValue={value}
              name={name}
              onBlur={onBlur}
              ref={ref}
              language="en"
              className={cn(
                "w-full px-10 pr-8 h-10 md:h-12 rounded-full border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-red-500",
                className
              )}
              placeholder={placeholder}
              options={{
                types: ["establishment"],
                fields: ["formatted_address", "geometry", "name"],
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      </AsyncComponent>
    );
  }
);

LocationSearchInput.displayName = "LocationSearchInput";

// import { forwardRef } from "react";
// import { Search, ChevronDown } from "lucide-react";
// import { Input } from "./ui/input";
// import { cn } from "@/lib/utils";
// import AsyncComponent from "./async-component";
// import { useTranslation } from "react-i18next";
// import GoogleAutocomplete from "react-google-autocomplete";

// const Autocomplete = forwardRef((props, ref) => (
//   <GoogleAutocomplete {...props} ref={ref} />
// ));
// Autocomplete.displayName = "Autocomplete";

// export const LocationSearchInput = forwardRef(
//   ({ name, value, onChange, onBlur, className, placeholder, error }, ref) => {
//     const { t } = useTranslation();

//     return (
//       <AsyncComponent>
//         <div className="relative">
//           <div className="relative">
//             <Autocomplete
//               apiKey={import.meta.env.VITE_GOOGLE_LOCATION_KEY}
//               onPlaceSelected={(place) => {
//                 onChange(place.formatted_address);
//               }}
//               defaultValue={value}
//               name={name}
//               onBlur={onBlur}
//               ref={ref}
//               className={cn(
//                 "w-full px-10 pr-8 h-10 md:h-12 rounded-full border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
//                 error && "border-red-500",
//                 className,
//               )}
//               placeholder={placeholder}
//               options={{
//                 types: ["(establishment)"],
//                 fields: ["formatted_address", "geometry", "name"],
//               }}
//             />
//             <div className="absolute left-3 top-1/2 -translate-y-1/2">
//               <Search className="h-4 w-4 text-gray-500" />
//             </div>
//             <div className="absolute right-3 top-1/2 -translate-y-1/2">
//               <ChevronDown className="h-4 w-4 text-gray-500" />
//             </div>
//           </div>
//           {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
//         </div>
//       </AsyncComponent>
//     );
//   },
// );

// LocationSearchInput.displayName = "LocationSearchInput";
