import { useEffect, useRef, useState } from "react";
import FamilyTree from "../balkan/familytree";
import { FamilyMemberDialog } from "./family-member-dialog";
import AsyncComponent from "./async-component";
import { Select } from "./ui/select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { orientationList } from "@/constants/dropDownConstants";
import { Button } from "./ui/button";
import { Menu, Play } from "lucide-react";
import TutorialVideoDialog from "./tutorial-dialog";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";
import { useNavigate } from "react-router";
import { encryptId } from "@/utils/encryption";
import AddGodFatherDialog from "./addGodFatherDialog";
import toast from "react-hot-toast";
import RollingGalleryDialog from "./rolling-gallery-dialog";
import { useWindowSize } from "@/hooks/useWindowSize";

const Tree = ({ nodes, familyMembers }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const { leftSidebar, toggleLeftSidebar } = useState(false);
  const navigate = useNavigate();
  const [addGodFatherDialog, setAddGodFatherDialog] = useState(false);
  const [openRollingGallery, setOpenRollingGallery] = useState(false);

  const { width } = useWindowSize();

  const [viewFamilyMemberDialog, setViewFamilyMemberDialog] = useState({
    modalOpen: false,
    selectedMember: null,
    selectedMemberInfo: null,
  });

  const divRef = useRef();
  const familyRef = useRef();
  const { theme } = useThemeLanguage();
  const [config, setConfig] = useState({
    orientation: "left_top",
    search: "",
    gender: "all",
  });

  const myGodfather = nodes?.find(
    (item) => item.relation?.toLowerCase() === "myself",
  )?.has_godfather;
  const hasChildren = nodes?.some(
    (item) =>
      item?.relation?.toLowerCase() === "son" ||
      item?.relation?.toLowerCase() === "daughter",
  );
  const children = nodes?.filter(
    (item) =>
      item.relation?.toLowerCase() === "son" ||
      item.relation?.toLowerCase() === "daughter",
  );

  const childrenGodfather =
    children?.length > 0
      ? children.every((child) => child.has_godfather)
      : false;

  useEffect(() => {
    var self = this;
    FamilyTree.toolbarUI.fitIcon =
      "<div class='ft-fit-icon p-2 border-2 border-brandSecondary rounded-lg bg-brandSecondary'><img src='/icons/fit-screen.svg' class='w-4 h-4 text-center'></div>";
    FamilyTree.toolbarUI.zoomOutIcon =
      '<div class="ft-minus-icon p-2 border-2 border-brandSecondary rounded-lg bg-brandSecondary"><img src="/icons/zoom-out.svg" class="w-4 h-4 text-center"></div>';
    FamilyTree.toolbarUI.zoomInIcon =
      '<div class="ft-plus-icon p-2 border-2 border-brandSecondary rounded-lg bg-brandSecondary"><img src="/icons/zoom-in.svg" class="w-4 h-4 text-center"></div>';
    FamilyTree.toolbarUI.fullScreen =
      '<div class="ft-icon p-2 border-2 border-brandSecondary rounded-lg bg-brandSecondary"><img src="/icons/zoom-in.svg" class="w-4 h-4 text-center"></div>';
    FamilyTree.toolbarUI.fullScreen =
      '<div class="ft-icon p-2 border-2 border-brandSecondary rounded-lg bg-brandSecondary"><img src="/icons/zoom-in.svg" class="w-4 h-4 text-center"></div>';

    FamilyTree.templates.kintree = Object.assign({}, FamilyTree.templates.base);
    FamilyTree.templates.kintree.field_0 =
      "<text " +
      FamilyTree.attr.width +
      ' ="230" style="font-size: 12px;font-weight:bold;;" fill="#000000" x="60" y="0" text-anchor="start"><tspan x="60" y="20" dy="0em">{val}</tspan></text>';
    FamilyTree.templates.kintree.defs =
      '<filter x="-0.1" y="-0.1" width="1.2" height="1.2" id="solid1"><feFlood flood-color="#171717"/><feComposite in="SourceGraphic" operator="xor" /></filter>';

    FamilyTree.templates.kintree.field_1 =
      '<defs><filter x="-0.1" y="-0.1" width="1.3" height="1.4" id="solid"><feFlood flood-color="transparent"/><feGaussianBlur stdDeviation="3"/><feComponentTransfer><feFuncA type="table"tableValues="0 0 0 1"/></feComponentTransfer><feComponentTransfer><feFuncA type="table"tableValues="0 1 1 1 1 1 1 1"/></feComponentTransfer><feComposite in="SourceGraphic" operator="xor"/></filter></defs><text filter="url(#solid)" x="65" y="35" font-size="10">{val}</text>';

    FamilyTree.templates.kintree.field_2 = `<g><image href="bday.svg" x="60" y="43" height="10" width="10" /></g><text x="70" y="52" font-size="8" font-weight="500" fill="#525252">{val}</text>`;

    FamilyTree.templates.kintree.img_0 =
      '<use xlink:href="#kintree_img_0_stroke"></use><image preserveAspectRatio="xMidYMid slice" clip-path="url(#kin_img_0)"  xlink:href="{val}" x="10" y="10" width="45" height="45"></image>';

    FamilyTree.templates.kintree.defs = `<clipPath id="kin_img_0"><rect id="kintree_img_0_stroke" stroke-width="0" fill="#E7AE58" stroke="#E7AE58" x="10" y="9" rx="50" ry="50" width="45" height="45"></rect></clipPath>
        <g  id="heart"><circle cx="7.50262" cy="7.29803" r="6.49068" fill="white" stroke="#943F7F" stroke-width="1.18012"/><path d="M8.61448 7.29824C8.61448 7.76505 8.47807 8.22138 8.22251 8.60952C7.96695 8.99766 7.60371 9.30018 7.17873 9.47882C6.75374 9.65746 6.2861 9.7042 5.83494 9.61313C5.38378 9.52206 4.96937 9.29727 4.6441 8.96718C4.31883 8.6371 4.09732 8.21654 4.00758 7.7587C3.91784 7.30085 3.9639 6.82629 4.13993 6.39501C4.31597 5.96373 4.61407 5.59511 4.99654 5.33576C5.37902 5.07641 5.82869 4.93799 6.28868 4.93799" stroke="#943F7F" fill="none" stroke-width="0.708075" stroke-linecap="round"/><path d="M6.39258 7.29824C6.39258 6.83142 6.52898 6.37509 6.78454 5.98695C7.04011 5.59881 7.40335 5.29629 7.82833 5.11765C8.25331 4.93901 8.72095 4.89227 9.17211 4.98334C9.62327 5.07441 10.0377 5.2992 10.363 5.62929C10.6882 5.95938 10.9097 6.37993 10.9995 6.83778C11.0892 7.29562 11.0432 7.77019 10.8671 8.20147C10.6911 8.63274 10.393 9.00136 10.0105 9.26071C9.62804 9.52006 9.17837 9.65849 8.71837 9.65849" stroke="#943F7F" fill="none" stroke-width="0.708075" stroke-linecap="round"/></g>`;
    FamilyTree.templates.kintree.field_3 = `
        <image href="/godFBadge.svg" x="-20" y="45" width={val} height="30" />
    `;
    FamilyTree.templates.kintree.pointer = `<g data-pointer="pointer" transform="matrix(0,0,0,0,100,100)">
        <g transform="matrix(0.3,0,0,0.3,-17,-17)">
            <polygon fill="rgb(255, 202, 40)" points="53.004,173.004 53.004,66.996 0,120" />
            <polygon fill="rgb(255, 202, 40)" points="186.996,66.996 186.996,173.004 240,120" />
            <polygon fill="rgb(255, 202, 40)" points="66.996,53.004 173.004,53.004 120,0" />
            <polygon fill="rgb(255, 202, 40)" points="120,240 173.004,186.996 66.996,186.996" />
            <circle fill="rgb(255, 202, 40)" cx="120" cy="120" r="30" />
        </g>
    </g>`;

    FamilyTree.templates.kintree.node =
      '<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" stroke="#E7AE58" fill="#FFF5EA" rx="20" ry="20"></rect>';

    // First Template
    FamilyTree.templates.kintree_temp_one = Object.assign(
      {},
      FamilyTree.templates.kintree,
    );

    FamilyTree.templates.kintree_temp_one.img_0 =
      '<use xlink:href="#kintree_sc_img_0_stroke"></use><image preserveAspectRatio="xMidYMid slice" clip-path="url(#kin_sc_img_0)"  xlink:href="{val}" x="10" y="10" width="45" height="45"></image>';

    FamilyTree.templates.kintree_temp_one.defs =
      '<clipPath id="kin_sc_img_0"><rect id="kintree_sc_img_0_stroke" stroke-width="0" fill="#58B4E7" stroke="#58B4E7" x="10" y="9" rx="50" ry="50" width="45" height="45"></rect></clipPath>';

    FamilyTree.templates.kintree_temp_one.node =
      '<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" stroke="#58B4E7" fill="#EEF8FD" rx="20" ry="20"></rect>';

    // Second Template
    FamilyTree.templates.kintree_temp_two = Object.assign(
      {},
      FamilyTree.templates.kintree,
    );

    FamilyTree.templates.kintree_temp_two.img_0 =
      '<use xlink:href="#kintree_tc_img_0_stroke"></use><image preserveAspectRatio="xMidYMid slice" clip-path="url(#kin_tc_img_0)"  xlink:href="{val}" x="10" y="10" width="45" height="45"></image>';

    FamilyTree.templates.kintree_temp_two.defs =
      '<clipPath id="kin_tc_img_0"><rect id="kintree_tc_img_0_stroke" stroke-width="0" fill="#54D052" stroke="#54D052" x="10" y="9" rx="50" ry="50" width="45" height="45"></rect></clipPath>';

    FamilyTree.templates.kintree_temp_two.node =
      '<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" stroke="#54D052" fill="#EEFAEE" rx="20" ry="20"></rect>';

    // Third Template
    FamilyTree.templates.kintree_temp_three = Object.assign(
      {},
      FamilyTree.templates.kintree,
    );

    FamilyTree.templates.kintree_temp_three.img_0 =
      '<use xlink:href="#kintree_frc_img_0_stroke"></use><image preserveAspectRatio="xMidYMid slice" clip-path="url(#kin_frc_img_0)"  xlink:href="{val}" x="10" y="10" width="45" height="45"></image>';

    FamilyTree.templates.kintree_temp_three.defs =
      '<clipPath id="kin_frc_img_0"><rect id="kintree_frc_img_0_stroke" stroke-width="0" fill="#A34CE9" stroke="#54D052" x="10" y="9" rx="50" ry="50" width="45" height="45"></rect></clipPath>';

    FamilyTree.templates.kintree_temp_three.node =
      '<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" stroke="#A34CE9" fill="#F6EDFD" rx="20" ry="20"></rect>';

    // Fourth Template
    FamilyTree.templates.kintree_temp_four = Object.assign(
      {},
      FamilyTree.templates.kintree,
    );

    FamilyTree.templates.kintree_temp_four.img_0 =
      '<use xlink:href="#kintree_fc_img_0_stroke"></use><image preserveAspectRatio="xMidYMid slice" clip-path="url(#kin_fc_img_0)"  xlink:href="{val}" x="10" y="10" width="45" height="45"></image>';

    FamilyTree.templates.kintree_temp_four.defs =
      '<clipPath id="kin_fc_img_0"><rect id="kintree_fc_img_0_stroke" stroke-width="0" fill="#E75858" stroke="#54D052" x="10" y="9" rx="50" ry="50" width="45" height="45"></rect></clipPath>';

    FamilyTree.templates.kintree_temp_four.node =
      '<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" stroke="#E75858" fill="#FDEEEE" rx="20" ry="20"></rect>';

    // Fifth Template

    FamilyTree.templates.kintree_temp_five = Object.assign(
      {},
      FamilyTree.templates.kintree,
    );
    FamilyTree.templates.kintree_temp_five.img_0 =
      '<use xlink:href="#kintree_fic_img_0_stroke"></use><image preserveAspectRatio="xMidYMid slice" clip-path="url(#kin_fic_img_0)"  xlink:href="{val}" x="10" y="10" width="45" height="45"></image>';
    FamilyTree.templates.kintree_temp_five.defs =
      '<clipPath id="kin_fic_img_0"><rect id="kintree_fic_img_0_stroke" stroke-width="0" fill="#5E5F60" stroke="#D0D0D0" x="10" y="9" rx="50" ry="50" width="45" height="45"></rect></clipPath>';
    FamilyTree.templates.kintree_temp_five.node =
      '<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" stroke="#5E5F60" fill="#D0D0D0" rx="20" ry="20"></rect>';

    FamilyTree.templates.kintree_temp_one.field_3 =
      FamilyTree.templates.kintree.field_3;
    FamilyTree.templates.kintree_temp_two.field_3 =
      FamilyTree.templates.kintree.field_3;
    FamilyTree.templates.kintree_temp_three.field_3 =
      FamilyTree.templates.kintree.field_3;
    FamilyTree.templates.kintree_temp_four.field_3 =
      FamilyTree.templates.kintree.field_3;
    FamilyTree.templates.kintree_temp_five.field_3 =
      FamilyTree.templates.kintree.field_3;

    FamilyTree.searchUI.createInputField = function (p) {
      return (
        "<div " +
        FamilyTree.attr.id +
        '="search" style="display:none;border-radius: 20px 20px;padding:5px;     box-shadow: 0 2px 8px 0 rgb(0 0 0 / 6%); font-family:Roboto-Regular, Helvetica;color:#7a7a7a;font-size:14px;width:300px;position:absolute;top:32px;right:' +
        p +
        'px;background-color:#ffffff;">' +
        "<div>" +
        '<div style="float:right;">' +
        '<img src="' +
        _base_url_new +
        'assets/img/icons/Search-Black.svg" width="30" height="30" />' +
        "</div>" +
        "<div " +
        FamilyTree.attr.id +
        '="cell-1" style="float:right; width:83%">' +
        '<input title="' +
        FamilyTree.SEARCH_PLACEHOLDER +
        '" placeholder="' +
        FamilyTree.SEARCH_PLACEHOLDER +
        '" style="font-size:14px;font-family:Roboto-Regular, Helvetica;color:#7a7a7a;width:98%;border:none;outline:none; padding-top:10px;" type="text" />' +
        "</div>" +
        '<div style="clear:both;"></div>' +
        "</div>" +
        "<div " +
        FamilyTree.attr.id +
        '="container"></div>' +
        "</div>"
      );
    };

    const rootNode = nodes?.find?.(
      (item) => item.relation?.toLowerCase() === "myself",
    );
    if (!rootNode) {
      console.error("Root node not found");
      return;
    }

    const family = new FamilyTree(divRef.current, {
      template: "kintree",
      nodes: nodes,
      mouseScrool: FamilyTree.action.zoom,
      nodeMouseClick: FamilyTree.action.none,
      mode: theme || "light",
      // scaleInitial: FamilyTree.match.boundary,
      scaleIntitial: FamilyTree.match.width,
      // scaleInitial: 1,
      scaleMax: 2,
      enableSearch: true,
      searchFields: ["name"],
      orientation: FamilyTree.orientation[config.orientation],
      partnerChildrenSplitSeparation: 10,
      align: FamilyTree.ORIENTATION,
      zoom: {
        speed: 120,
        smooth: 10,
      },
      nodeTreeMenu: false,
      root: nodes?.find((item) => item.relation?.toLowerCase() === "myself")?.id
        ? [nodes.find((item) => item.relation?.toLowerCase() === "myself").id]
        : [],
      nodeBinding: {
        // field_0: "name",
        field_0: function (sender, node) {
          var data = sender.get(node.id);
          var name = data["name"];
          var threshold = 12;
          if (name?.length <= threshold) return name;
          return name.substr(0, threshold).concat("...");
        },
        field_1: function (sender, node) {
          var data = sender.get(node.id);
          var relation = data["relation"];
          var threshold = 10;
          if (relation?.length <= threshold) return relation || "";
          return relation ? relation.substr(0, threshold).concat("...") : "";
        },
        // field_2: "dob",
        field_2: function (sender, node) {
          var data = sender.get(node.id);
          var dob = data["dob"] || "--/--/--";
          var threshold = 10;
          if (dob.length <= threshold) return dob;
          return dob.substr(0, threshold).concat("...");
        },
        field_3: function (sender, node) {
          const data = sender.get(node.id);
          if (data.is_godfather == true) {
            return "70";
          }
        },
        img_0: "photo",
      },
      tags: {
        kintree: {
          template: "kintree",
        },
        kintree_temp_one: {
          template: "kintree_temp_one",
        },
        kintree_temp_two: {
          template: "kintree_temp_two",
        },
        kintree_temp_three: {
          template: "kintree_temp_three",
        },
        kintree_temp_four: {
          template: "kintree_temp_four",
        },
        kintree_temp_five: {
          template: "kintree_temp_five",
        },
      },
      miniMap: false,
      toolbar: {
        fullScreen: false,
        zoom: true,
        expandAll: false,
        fit: true,
      },
    });
    familyRef.current = family;
    family.on("click", function (sender, args) {
      const data = sender.get(args.node.id);
      const encryptedId = encryptId(data?.id);
      if (!encryptedId) {
        console.error("Encryption failed");
        return;
      }

      navigate(`/family-member/${encryptedId}`);
    });
    const search = family.search(config?.search, ["name"], ["name"]);
    family.center(
      nodes?.find((item) => item.relation?.toLowerCase() === "myself").id,
    );
  }, [nodes, theme, familyMembers, config]);

  useEffect(() => {
    const handleResize = () => {
      if (familyRef.current) {
        familyRef.current.fit();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleOrientationChange = (value) => {
    setConfig((prev) => ({ ...prev, orientation: value }));
  };

  return (
    <AsyncComponent>
      <div className="w-full h-full relative">
        <div className="w-full flex gap-4 justify-start items-center p-4 bg-background border-b rounded-t-2xl">
          <Menu
            className="w-6 h-6 cursor-pointer hidden sm:block"
            onClick={() => toggleLeftSidebar()}
          />
          <div className="w-40">
            <Select name="relation" onValueChange={handleOrientationChange}>
              <SelectTrigger className="rounded-full h-10">
                <SelectValue placeholder="Select Orientation" />
              </SelectTrigger>
              <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                <SelectGroup>
                  <SelectLabel>Orientation</SelectLabel>
                  {orientationList?.map((orientation) => (
                    <SelectItem
                      key={orientation?.id}
                      value={orientation?.value}
                    >
                      {orientation?.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowTutorial(true)}
            size="icon"
            className="rounded-full h-8 w-8 flex items-center justify-center"
          >
            <Play />
          </Button>
          {width > 1024 ? (
            <Button
              onClick={() => setOpenRollingGallery(true)}
              size="icon"
              className="w-32 rounded-full flex items-center justify-center"
            >
              Open Gallery
            </Button>
          ) : null}
        </div>
        <Button
          className="absolute bottom-4 rounded-full godfather-button h-12 w-12 sm:w-[175px] sm:h-[48px]"
          onClick={() => {
            if (!myGodfather || !childrenGodfather) {
              setAddGodFatherDialog(true);
            } else {
              toast.error(
                "You can only have one godfather for yourself and one for your children.",
              );
            }
          }}
        >
          <span className="rounded-full sm:bg-white w-8 h-8 flex items-center justify-center">
            <img
              src="/add-godfather.svg"
              alt="Add GodFather"
              className="w-6 h-6"
            />
          </span>
          <span className="hidden sm:block">Add Godfather</span>
        </Button>
        <div
          id="tree"
          ref={divRef}
          className="w-full min-h-[calc(100%-72px)] max-h-[calc(100%-72px)] !static rounded-b-2xl pt-[40px] sm:pt-0"
        />
        {viewFamilyMemberDialog?.modalOpen ? (
          <FamilyMemberDialog
            isOpen={viewFamilyMemberDialog?.modalOpen}
            onClose={() =>
              setViewFamilyMemberDialog({
                modalOpen: false,
                selectedMember: null,
                selectedMemberInfo: null,
              })
            }
            selectedMemberInfo={viewFamilyMemberDialog?.selectedMemberInfo}
            selectedMember={viewFamilyMemberDialog?.selectedMember}
            nodes={nodes}
          />
        ) : null}
        {showTutorial ? (
          <TutorialVideoDialog
            isOpen={showTutorial}
            onClose={() => setShowTutorial(false)}
          />
        ) : null}
        {addGodFatherDialog ? (
          <AddGodFatherDialog
            open={addGodFatherDialog}
            onClose={() => setAddGodFatherDialog(false)}
            hasChildren={hasChildren}
            myGodfather={myGodfather}
            childrenGodfather={childrenGodfather}
          />
        ) : null}
        {openRollingGallery ? (
          <RollingGalleryDialog
            open={openRollingGallery}
            onClose={() => setOpenRollingGallery(false)}
            images={nodes?.map((node) => node.photo)}
          />
        ) : null}
      </div>
    </AsyncComponent>
  );
};

export default Tree;
