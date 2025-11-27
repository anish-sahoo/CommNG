"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SingleSelectButtonGroup } from "@/components/button-single-select";
import { DropdownSelect } from "@/components/dropdown-select";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

export default function CreateAccountPage() {
  const router = useRouter();
  const trpc = useTRPCClient();
  const [email, _setEmail] = useState("");
  const [phone, _setPhone] = useState("");
  const [fullname, _setFullname] = useState("");
  const rankOptions = [
    {
      label: "Army National Guard",
      value: "army-national-guard",
      dropdownOptions: [
        { label: "E-1 (Private)", value: "e1-private" },
        { label: "E-2 (Private Second Class)", value: "e2-private-second" },
        { label: "E-3 (Private First Class)", value: "e3-private-first" },
        { label: "E-4 (Specialist/Corporal)", value: "e4-specialist" },
        { label: "E-5 (Sergeant)", value: "e5-sergeant" },
        { label: "E-6 (Staff Sergeant)", value: "e6-staff-sergeant" },
        { label: "E-7 (Sergeant First Class)", value: "e7-sfc" },
        { label: "E-8 (Master Sergeant)", value: "e8-master-sergeant" },
        { label: "E-8 (First Sergeant)", value: "e8-first-sergeant" },
        { label: "E-9 (Sergeant Major)", value: "e9-sergeant-major" },
        { label: "E-9 (Command Sergeant Major)", value: "e9-csm" },
        { label: "E-9 (Sergeant Major of the Army)", value: "e9-sma" },
        { label: "O-1 (Second Lieutenant)", value: "o1-second-lieutenant" },
        { label: "O-2 (First Lieutenant)", value: "o2-first-lieutenant" },
        { label: "O-3 (Captain)", value: "o3-captain" },
        { label: "O-4 (Major)", value: "o4-major" },
        { label: "O-5 (Lieutenant Colonel)", value: "o5-lieutenant-colonel" },
        { label: "O-6 (Colonel)", value: "o6-colonel" },
        { label: "O-7 (Brigadier General)", value: "o7-brigadier-general" },
        { label: "O-8 (Major General)", value: "o8-major-general" },
        { label: "O-9 (Lieutenant General)", value: "o9-lieutenant-general" },
        { label: "O-10 (General/General of the Army)", value: "o10-general" },
      ],
    },
    {
      label: "Air Force National Guard",
      value: "air-force-national-guard",
      dropdownOptions: [
        { label: "E-1 (Airman Basic)", value: "e1-airman-basic" },
        { label: "E-2 (Airman)", value: "e2-airman" },
        { label: "E-3 (Airman First Class)", value: "e3-airman-first-class" },
        { label: "E-4 (Senior Airman)", value: "e4-senior-airman" },
        { label: "E-5 (Staff Sergeant)", value: "e5-staff-sergeant" },
        { label: "E-6 (Technical Sergeant)", value: "e6-technical-sergeant" },
        { label: "E-7 (Master Sergeant)", value: "e7-master-sergeant" },
        { label: "E-8 (Senior Master Sergeant)", value: "e8-senior-master" },
        { label: "E-9 (Chief Master Sergeant)", value: "e9-chief-master" },
        { label: "E-9 (Command Chief Master Sergeant)", value: "e9-ccms" },
        {
          label: "E-9 (Chief Master Sergeant of the Air Force)",
          value: "e9-cmsaf",
        },
        { label: "O-1 (Second Lieutenant)", value: "o1-second-lieutenant" },
        { label: "O-2 (First Lieutenant)", value: "o2-first-lieutenant" },
        { label: "O-3 (Captain)", value: "o3-captain" },
        { label: "O-4 (Major)", value: "o4-major" },
        { label: "O-5 (Lieutenant Colonel)", value: "o5-lieutenant-colonel" },
        { label: "O-6 (Colonel)", value: "o6-colonel" },
        { label: "O-7 (Brigadier General)", value: "o7-brigadier-general" },
        { label: "O-8 (Major General)", value: "o8-major-general" },
        { label: "O-9 (Lieutenant General)", value: "o9-lieutenant-general" },
        {
          label: "O-10 (General/General of the Air Force)",
          value: "o10-general",
        },
      ],
    },
  ];
  const [branch, setBranch] = useState<string>("");
  const [rankSelection, setRankSelection] = useState<string>("");
  const [multiLineText, setMultiLineText] = useState<string>("");
  const [locationSelection, setLocationSelection] = useState<string>("");
  const [careerField, setCareerField] = useState<string>("");

  const locationOptions = [
    { label: "Abington", value: "abington-ma" },
    { label: "Acton", value: "acton-ma" },
    { label: "Acushnet", value: "acushnet-ma" },
    { label: "Adams", value: "adams-ma" },
    { label: "Agawam", value: "agawam-ma" },
    { label: "Amesbury", value: "amesbury-ma" },
    { label: "Amherst", value: "amherst-ma" },
    { label: "Andover", value: "andover-ma" },
    { label: "Arlington", value: "arlington-ma" },
    { label: "Ashburnham", value: "ashburnham-ma" },
    { label: "Ashby", value: "ashby-ma" },
    { label: "Ashfield", value: "ashfield-ma" },
    { label: "Ashland", value: "ashland-ma" },
    { label: "Athol", value: "athol-ma" },
    { label: "Attleboro", value: "attleboro-ma" },
    { label: "Auburn", value: "auburn-ma" },
    { label: "Avon", value: "avon-ma" },
    { label: "Ayer", value: "ayer-ma" },
    { label: "Baldwinville", value: "baldwinville-ma" },
    { label: "Barnstable", value: "barnstable-ma" },
    { label: "Barre", value: "barre-ma" },
    { label: "Becket", value: "becket-ma" },
    { label: "Bedford", value: "bedford-ma" },
    { label: "Belchertown", value: "belchertown-ma" },
    { label: "Bellingham", value: "bellingham-ma" },
    { label: "Belmont", value: "belmont-ma" },
    { label: "Berkley", value: "berkley-ma" },
    { label: "Berlin", value: "berlin-ma" },
    { label: "Bernardston", value: "bernardston-ma" },
    { label: "Beverly", value: "beverly-ma" },
    { label: "Billerica", value: "billerica-ma" },
    { label: "Blackstone", value: "blackstone-ma" },
    { label: "Blandford", value: "blandford-ma" },
    { label: "Bolton", value: "bolton-ma" },
    { label: "Bondsville", value: "bondsville-ma" },
    { label: "Boston", value: "boston-ma" },
    { label: "Boxborough", value: "boxborough-ma" },
    { label: "Boxford", value: "boxford-ma" },
    { label: "Boylston", value: "boylston-ma" },
    { label: "Braintree", value: "braintree-ma" },
    { label: "Brewster", value: "brewster-ma" },
    { label: "Bridgewater", value: "bridgewater-ma" },
    { label: "Brimfield", value: "brimfield-ma" },
    { label: "Brockton", value: "brockton-ma" },
    { label: "Brookfield", value: "brookfield-ma" },
    { label: "Brookline", value: "brookline-ma" },
    { label: "Buckland", value: "buckland-ma" },
    { label: "Burlington", value: "burlington-ma" },
    { label: "Buzzards Bay", value: "buzzards-bay-ma" },
    { label: "Cambridge", value: "cambridge-ma" },
    { label: "Canton", value: "canton-ma" },
    { label: "Carlisle", value: "carlisle-ma" },
    { label: "Carver", value: "carver-ma" },
    { label: "Charlemont", value: "charlemont-ma" },
    { label: "Charlton", value: "charlton-ma" },
    { label: "Chatham", value: "chatham-ma" },
    { label: "Chelmsford", value: "chelmsford-ma" },
    { label: "Chelsea", value: "chelsea-ma" },
    { label: "Cheshire", value: "cheshire-ma" },
    { label: "Chester", value: "chester-ma" },
    { label: "Chesterfield", value: "chesterfield-ma" },
    { label: "Chicopee", value: "chicopee-ma" },
    { label: "Chilmark", value: "chilmark-ma" },
    { label: "Clinton", value: "clinton-ma" },
    { label: "Cohasset", value: "cohasset-ma" },
    { label: "Colrain", value: "colrain-ma" },
    { label: "Concord", value: "concord-ma" },
    { label: "Conway", value: "conway-ma" },
    { label: "Cummington", value: "cummington-ma" },
    { label: "Dalton", value: "dalton-ma" },
    { label: "Danvers", value: "danvers-ma" },
    { label: "Dartmouth", value: "dartmouth-ma" },
    { label: "Dedham", value: "dedham-ma" },
    { label: "Deerfield", value: "deerfield-ma" },
    { label: "Dennis Port", value: "dennis-port-ma" },
    { label: "Dennis", value: "dennis-ma" },
    { label: "Douglas", value: "douglas-ma" },
    { label: "Dover", value: "dover-ma" },
    { label: "Dracut", value: "dracut-ma" },
    { label: "Dudley", value: "dudley-ma" },
    { label: "Dunstable", value: "dunstable-ma" },
    { label: "Duxbury", value: "duxbury-ma" },
    { label: "East Bridgewater", value: "east-bridgewater-ma" },
    { label: "East Brookfield", value: "east-brookfield-ma" },
    { label: "East Dennis", value: "east-dennis-ma" },
    { label: "East Falmouth", value: "east-falmouth-ma" },
    { label: "East Longmeadow", value: "east-longmeadow-ma" },
    { label: "East Sandwich", value: "east-sandwich-ma" },
    { label: "Eastham", value: "eastham-ma" },
    { label: "Easthampton", value: "easthampton-ma" },
    { label: "Easton", value: "easton-ma" },
    { label: "Edgartown", value: "edgartown-ma" },
    { label: "Erving", value: "erving-ma" },
    { label: "Essex", value: "essex-ma" },
    { label: "Everett", value: "everett-ma" },
    { label: "Fairhaven", value: "fairhaven-ma" },
    { label: "Fall River", value: "fall-river-ma" },
    { label: "Falmouth", value: "falmouth-ma" },
    { label: "Fiskdale", value: "fiskdale-ma" },
    { label: "Fitchburg", value: "fitchburg-ma" },
    { label: "Forestdale", value: "forestdale-ma" },
    { label: "Foxboro", value: "foxboro-ma" },
    { label: "Framingham", value: "framingham-ma" },
    { label: "Franklin", value: "franklin-ma" },
    { label: "Gardner", value: "gardner-ma" },
    { label: "Georgetown", value: "georgetown-ma" },
    { label: "Gloucester", value: "gloucester-ma" },
    { label: "Goshen", value: "goshen-ma" },
    { label: "Grafton", value: "grafton-ma" },
    { label: "Granby", value: "granby-ma" },
    { label: "Granville", value: "granville-ma" },
    { label: "Great Barrington", value: "great-barrington-ma" },
    { label: "Green Harbor", value: "green-harbor-ma" },
    { label: "Greenfield", value: "greenfield-ma" },
    { label: "Groton", value: "groton-ma" },
    { label: "Groveland", value: "groveland-ma" },
    { label: "Hadley", value: "hadley-ma" },
    { label: "Halifax", value: "halifax-ma" },
    { label: "Hamilton", value: "hamilton-ma" },
    { label: "Hampden", value: "hampden-ma" },
    { label: "Hanover", value: "hanover-ma" },
    { label: "Hanson", value: "hanson-ma" },
    { label: "Hardwick", value: "hardwick-ma" },
    { label: "Harvard", value: "harvard-ma" },
    { label: "Harwich Port", value: "harwich-port-ma" },
    { label: "Harwich", value: "harwich-ma" },
    { label: "Hatfield", value: "hatfield-ma" },
    { label: "Haverhill", value: "haverhill-ma" },
    { label: "Heath", value: "heath-ma" },
    { label: "Hingham", value: "hingham-ma" },
    { label: "Hinsdale", value: "hinsdale-ma" },
    { label: "Holbrook", value: "holbrook-ma" },
    { label: "Holden", value: "holden-ma" },
    { label: "Holland", value: "holland-ma" },
    { label: "Holliston", value: "holliston-ma" },
    { label: "Holyoke", value: "holyoke-ma" },
    { label: "Hopedale", value: "hopedale-ma" },
    { label: "Hopkinton", value: "hopkinton-ma" },
    { label: "Housatonic", value: "housatonic-ma" },
    { label: "Hubbardston", value: "hubbardston-ma" },
    { label: "Hudson", value: "hudson-ma" },
    { label: "Hull", value: "hull-ma" },
    { label: "Huntington", value: "huntington-ma" },
    { label: "Ipswich", value: "ipswich-ma" },
    { label: "Kingston", value: "kingston-ma" },
    { label: "Lakeville", value: "lakeville-ma" },
    { label: "Lancaster", value: "lancaster-ma" },
    { label: "Lanesboro", value: "lanesboro-ma" },
    { label: "Lawrence", value: "lawrence-ma" },
    { label: "Lee", value: "lee-ma" },
    { label: "Leicester", value: "leicester-ma" },
    { label: "Lenox", value: "lenox-ma" },
    { label: "Leominster", value: "leominster-ma" },
    { label: "Leverett", value: "leverett-ma" },
    { label: "Lexington", value: "lexington-ma" },
    { label: "Lincoln", value: "lincoln-ma" },
    { label: "Littleton", value: "littleton-ma" },
    { label: "Longmeadow", value: "longmeadow-ma" },
    { label: "Lowell", value: "lowell-ma" },
    { label: "Ludlow", value: "ludlow-ma" },
    { label: "Lunenburg", value: "lunenburg-ma" },
    { label: "Lynn", value: "lynn-ma" },
    { label: "Lynnfield", value: "lynnfield-ma" },
    { label: "Malden", value: "malden-ma" },
    { label: "Manchester", value: "manchester-ma" },
    { label: "Mansfield", value: "mansfield-ma" },
    { label: "Marblehead", value: "marblehead-ma" },
    { label: "Marion", value: "marion-ma" },
    { label: "Marlborough", value: "marlborough-ma" },
    { label: "Marshfield Hills", value: "marshfield-hills-ma" },
    { label: "Marshfield", value: "marshfield-ma" },
    { label: "Mashpee", value: "mashpee-ma" },
    { label: "Mattapoisett", value: "mattapoisett-ma" },
    { label: "Maynard", value: "maynard-ma" },
    { label: "Medfield", value: "medfield-ma" },
    { label: "Medford", value: "medford-ma" },
    { label: "Medway", value: "medway-ma" },
    { label: "Melrose", value: "melrose-ma" },
    { label: "Mendon", value: "mendon-ma" },
    { label: "Merrimac", value: "merrimac-ma" },
    { label: "Methuen", value: "methuen-ma" },
    { label: "Middleboro", value: "middleboro-ma" },
    { label: "Middlefield", value: "middlefield-ma" },
    { label: "Middleton", value: "middleton-ma" },
    { label: "Milford", value: "milford-ma" },
    { label: "Millbury", value: "millbury-ma" },
    { label: "Millis", value: "millis-ma" },
    { label: "Millville", value: "millville-ma" },
    { label: "Milton", value: "milton-ma" },
    { label: "Monson", value: "monson-ma" },
    { label: "Montague", value: "montague-ma" },
    { label: "Monterey", value: "monterey-ma" },
    { label: "Monument Beach", value: "monument-beach-ma" },
    { label: "Nahant", value: "nahant-ma" },
    { label: "Nantucket", value: "nantucket-ma" },
    { label: "Natick", value: "natick-ma" },
    { label: "Needham", value: "needham-ma" },
    { label: "New Bedford", value: "new-bedford-ma" },
    { label: "New Braintree", value: "new-braintree-ma" },
    { label: "New Salem", value: "new-salem-ma" },
    { label: "Newbury", value: "newbury-ma" },
    { label: "Newburyport", value: "newburyport-ma" },
    { label: "Newton", value: "newton-ma" },
    { label: "Norfolk", value: "norfolk-ma" },
    { label: "North Adams", value: "north-adams-ma" },
    { label: "North Amherst", value: "north-amherst-ma" },
    { label: "North Andover", value: "north-andover-ma" },
    { label: "North Attleboro", value: "north-attleboro-ma" },
    { label: "North Brookfield", value: "north-brookfield-ma" },
    { label: "North Eastham", value: "north-eastham-ma" },
    { label: "North Falmouth", value: "north-falmouth-ma" },
    { label: "North Pembroke", value: "north-pembroke-ma" },
    { label: "North Reading", value: "north-reading-ma" },
    { label: "North Scituate", value: "north-scituate-ma" },
    { label: "Northampton", value: "northampton-ma" },
    { label: "Northborough", value: "northborough-ma" },
    { label: "Northbridge", value: "northbridge-ma" },
    { label: "Northfield", value: "northfield-ma" },
    { label: "Norton", value: "norton-ma" },
    { label: "Norwell", value: "norwell-ma" },
    { label: "Norwood", value: "norwood-ma" },
    { label: "Oak Bluffs", value: "oak-bluffs-ma" },
    { label: "Oakham", value: "oakham-ma" },
    { label: "Ocean Bluff", value: "ocean-bluff-ma" },
    { label: "Onset", value: "onset-ma" },
    { label: "Orange", value: "orange-ma" },
    { label: "Orleans", value: "orleans-ma" },
    { label: "Otis", value: "otis-ma" },
    { label: "Oxford", value: "oxford-ma" },
    { label: "Palmer", value: "palmer-ma" },
    { label: "Paxton", value: "paxton-ma" },
    { label: "Peabody", value: "peabody-ma" },
    { label: "Pembroke", value: "pembroke-ma" },
    { label: "Pepperell", value: "pepperell-ma" },
    { label: "Petersham", value: "petersham-ma" },
    { label: "Pinehurst", value: "pinehurst-ma" },
    { label: "Pittsfield", value: "pittsfield-ma" },
    { label: "Plainfield", value: "plainfield-ma" },
    { label: "Plainville", value: "plainville-ma" },
    { label: "Plymouth", value: "plymouth-ma" },
    { label: "Plympton", value: "plympton-ma" },
    { label: "Pocasset", value: "pocasset-ma" },
    { label: "Princeton", value: "princeton-ma" },
    { label: "Provincetown", value: "provincetown-ma" },
    { label: "Quincy", value: "quincy-ma" },
    { label: "Randolph", value: "randolph-ma" },
    { label: "Raynham Center", value: "raynham-center-ma" },
    { label: "Raynham", value: "raynham-ma" },
    { label: "Reading", value: "reading-ma" },
    { label: "Rehoboth", value: "rehoboth-ma" },
    { label: "Revere", value: "revere-ma" },
    { label: "Richmond", value: "richmond-ma" },
    { label: "Rochester", value: "rochester-ma" },
    { label: "Rockland", value: "rockland-ma" },
    { label: "Rockport", value: "rockport-ma" },
    { label: "Rowe", value: "rowe-ma" },
    { label: "Rowley", value: "rowley-ma" },
    { label: "Royalston", value: "royalston-ma" },
    { label: "Russell", value: "russell-ma" },
    { label: "Rutland", value: "rutland-ma" },
    { label: "Sagamore", value: "sagamore-ma" },
    { label: "Salem", value: "salem-ma" },
    { label: "Salisbury", value: "salisbury-ma" },
    { label: "Sandisfield", value: "sandisfield-ma" },
    { label: "Sandwich", value: "sandwich-ma" },
    { label: "Saugus", value: "saugus-ma" },
    { label: "Savoy", value: "savoy-ma" },
    { label: "Scituate", value: "scituate-ma" },
    { label: "Seekonk", value: "seekonk-ma" },
    { label: "Sharon", value: "sharon-ma" },
    { label: "Sheffield", value: "sheffield-ma" },
    { label: "Shelburne Falls", value: "shelburne-falls-ma" },
    { label: "Sherborn", value: "sherborn-ma" },
    { label: "Shirley", value: "shirley-ma" },
    { label: "Shrewsbury", value: "shrewsbury-ma" },
    { label: "Shutesbury", value: "shutesbury-ma" },
    { label: "Somerset", value: "somerset-ma" },
    { label: "Somerville", value: "somerville-ma" },
    { label: "South Deerfield", value: "south-deerfield-ma" },
    { label: "South Dennis", value: "south-dennis-ma" },
    { label: "South Hadley", value: "south-hadley-ma" },
    { label: "South Lancaster", value: "south-lancaster-ma" },
    { label: "South Yarmouth", value: "south-yarmouth-ma" },
    { label: "Southampton", value: "southampton-ma" },
    { label: "Southborough", value: "southborough-ma" },
    { label: "Southbridge", value: "southbridge-ma" },
    { label: "Southwick", value: "southwick-ma" },
    { label: "Spencer", value: "spencer-ma" },
    { label: "Springfield", value: "springfield-ma" },
    { label: "Sterling", value: "sterling-ma" },
    { label: "Stockbridge", value: "stockbridge-ma" },
    { label: "Stoneham", value: "stoneham-ma" },
    { label: "Stoughton", value: "stoughton-ma" },
    { label: "Stow", value: "stow-ma" },
    { label: "Sturbridge", value: "sturbridge-ma" },
    { label: "Sudbury", value: "sudbury-ma" },
    { label: "Sunderland", value: "sunderland-ma" },
    { label: "Sutton", value: "sutton-ma" },
    { label: "Swampscott", value: "swampscott-ma" },
    { label: "Swansea", value: "swansea-ma" },
    { label: "Taunton", value: "taunton-ma" },
    { label: "Templeton", value: "templeton-ma" },
    { label: "Tewksbury", value: "tewksbury-ma" },
    { label: "Three Rivers", value: "three-rivers-ma" },
    { label: "Topsfield", value: "topsfield-ma" },
    { label: "Townsend", value: "townsend-ma" },
    { label: "Truro", value: "truro-ma" },
    { label: "Turners Falls", value: "turners-falls-ma" },
    { label: "Tyngsboro", value: "tyngsboro-ma" },
    { label: "Tyringham", value: "tyringham-ma" },
    { label: "Upton", value: "upton-ma" },
    { label: "Uxbridge", value: "uxbridge-ma" },
    { label: "Vineyard Haven", value: "vineyard-haven-ma" },
    { label: "Wakefield", value: "wakefield-ma" },
    { label: "Wales", value: "wales-ma" },
    { label: "Walpole", value: "walpole-ma" },
    { label: "Waltham", value: "waltham-ma" },
    { label: "Ware", value: "ware-ma" },
    { label: "Wareham", value: "wareham-ma" },
    { label: "Warren", value: "warren-ma" },
    { label: "Warwick", value: "warwick-ma" },
    { label: "Watertown", value: "watertown-ma" },
    { label: "Wayland", value: "wayland-ma" },
    { label: "Webster", value: "webster-ma" },
    { label: "Wellesley", value: "wellesley-ma" },
    { label: "Wellfleet", value: "wellfleet-ma" },
    { label: "Wendell", value: "wendell-ma" },
    { label: "Wenham", value: "wenham-ma" },
    { label: "West Boylston", value: "west-boylston-ma" },
    { label: "West Bridgewater", value: "west-bridgewater-ma" },
    { label: "West Brookfield", value: "west-brookfield-ma" },
    { label: "West Chatham", value: "west-chatham-ma" },
    { label: "West Dennis", value: "west-dennis-ma" },
    { label: "West Falmouth", value: "west-falmouth-ma" },
    { label: "West Newbury", value: "west-newbury-ma" },
    { label: "West Springfield", value: "west-springfield-ma" },
    { label: "West Stockbridge", value: "west-stockbridge-ma" },
    { label: "West Tisbury", value: "west-tisbury-ma" },
    { label: "West Wareham", value: "west-wareham-ma" },
    { label: "West Yarmouth", value: "west-yarmouth-ma" },
    { label: "Westborough", value: "westborough-ma" },
    { label: "Westfield", value: "westfield-ma" },
    { label: "Westford", value: "westford-ma" },
    { label: "Westminster", value: "westminster-ma" },
    { label: "Weston", value: "weston-ma" },
    { label: "Westport", value: "westport-ma" },
    { label: "Westwood", value: "westwood-ma" },
    { label: "Weymouth", value: "weymouth-ma" },
    { label: "Whately", value: "whately-ma" },
    { label: "Whitinsville", value: "whitinsville-ma" },
    { label: "Whitman", value: "whitman-ma" },
    { label: "Wilbraham", value: "wilbraham-ma" },
    { label: "Williamsburg", value: "williamsburg-ma" },
    { label: "Williamstown", value: "williamstown-ma" },
    { label: "Wilmington", value: "wilmington-ma" },
    { label: "Winchendon", value: "winchendon-ma" },
    { label: "Winchester", value: "winchester-ma" },
    { label: "Windsor", value: "windsor-ma" },
    { label: "Winthrop", value: "winthrop-ma" },
    { label: "Woburn", value: "woburn-ma" },
    { label: "Woods Hole", value: "woods-hole-ma" },
    { label: "Worcester", value: "worcester-ma" },
    { label: "Worthington", value: "worthington-ma" },
    { label: "Wrentham", value: "wrentham-ma" },
    { label: "Yarmouth Port", value: "yarmouth-port-ma" },
  ];

  const InterestOptions: MultiSelectOption[] = [
    { label: "Music", value: "music" },
    { label: "Creative Arts", value: "creative-arts" },
    { label: "Outdoor Activities", value: "outdoor-activities" },
    { label: "Gaming and Entertainment", value: "gaming-and-entertainment" },
    { label: "Cooking and Baking", value: "cooking-and-baking" },
    {
      label: "Volunteering and Community Involvement",
      value: "volunteering-and-community-involvement",
    },
    { label: "DIY and Crafts", value: "diy-and-crafts" },
    { label: "Team Sports", value: "team-sports" },
    { label: "Personal Fitness", value: "personal-fitness" },
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [dutySelection, setDutySelection] = useState<string>("");
  const [signalVisibility, setSignalVisibility] = useState<
    "private" | "public"
  >("private");
  const [emailVisibility, setEmailVisibility] = useState<"private" | "public">(
    "private"
  );

  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  const saveVisibility = async (
    nextSignal: "private" | "public",
    nextEmail: "private" | "public"
  ) => {
    try {
      setIsSavingVisibility(true);
      await trpc.user.updateUserVisibility.mutate({
        signal_visibility: nextSignal,
        email_visibility: nextEmail,
      });
      toast.success("Visibility updated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update visibility. Please try again.");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const handleCreateAccount = async () => {
    setIsCreateAccount(true);
    const res = await authClient.signOut();

    if (res.error) {
      const message =
        res.error.message ?? "Unable to create account right now.";
      toast.error(`${message} Please try again.`);
      setIsCreateAccount(false);
      return;
    }

    router.replace("/login");
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-left px-6 py-16 sm:gap-0 sm:px-10 lg:pr-16lg:px-16 ">
      <h1 className="text-3xl font-semibold text-secondary sm:text-4xl lg:text-3xl mb-3">
        Create Your Account
      </h1>
      <h1 className="text-left text-md font-medium text-secondary mb-1">
        Please fill out the following information to create your account.
      </h1>
      <h1 className="text-s sm:text-sm text-accent mb-6">
        *Required Information
      </h1>

      <div className="flex-1 max-w-lg space-y-6">
        <label htmlFor="login-fullname">Full Name*</label>
        <TextInput
          id="login-fullname"
          name="fullname"
          placeholder="Your full name"
          value={fullname}
          className="w-full mt-2"
        />

        <label htmlFor="login-email">
          Email address{" "}
          <span className="font-regular text-accent">(Not Required)</span>
        </label>
        <TextInput
          id="login-email"
          name="email"
          placeholder="you@example.com"
          value={email}
          className="w-full mt-2"
        />

        <label htmlFor="login-phone">Phone Number*</label>
        <TextInput
          id="login-phone"
          name="phone"
          placeholder="(123) 456-7890"
          value={phone}
          className="w-full mt-2"
        />

        <label htmlFor="login-location">Location*</label>
        <DropdownSelect
          options={locationOptions}
          value={locationSelection}
          onChange={setLocationSelection}
          className="w-full mt-2"
        />

        <label htmlFor="login-rank">What is your rank?*</label>
        <SingleSelectButtonGroup
          options={rankOptions}
          value={rankSelection}
          onChange={setRankSelection}
          onDropdownChange={(parent, child) => console.log(parent, child)}
          className="w-full mt-2"
        />

        <label htmlFor="login-branch">What is your branch?*</label>
        <TextInput
          id="login-branch"
          name="branch"
          placeholder="Your branch"
          value={branch}
          className="w-full mt-2"
          onChange={setBranch}
        />

        <label htmlFor="login-career-field">What is your career field?</label>
        <TextInput
          id="login-career-field"
          name="careerField"
          placeholder="Your career field"
          value={careerField}
          className="w-full mt-2"
          onChange={setCareerField}
        />

        <label htmlFor="login-duty-status">
          Are you active duty or part-time?*
        </label>
        <SingleSelectButtonGroup
          options={[
            { label: "Active Duty", value: "active-duty" },
            { label: "Part-time", value: "part-time" },
          ]}
          value={dutySelection}
          onChange={setDutySelection}
          onDropdownChange={(parent, child) => console.log(parent, child)}
        />

        <label htmlFor="login-biography">Short Biography*</label>
        <TextInput
          value={multiLineText}
          onChange={setMultiLineText}
          placeholder="Enter a short biography about yourself..."
          multiline={true}
          rows={5}
          maxLength={500}
          showCharCount={true}
          className="border-primary mt-2"
          counterColor="text-primary"
        />

        <label //selected here will appear selected in "interests" section of mentee/mentor forms
          htmlFor="login-interests"
        >
          Areas of Interest
        </label>
        <MultiSelect
          name="mentorInterests"
          helperText=" "
          options={InterestOptions}
          value={selectedInterests}
          onChange={setSelectedInterests}
          maxSelections={9}
        />

        <div className="flex-1 max-w-xl space-y-6">
          <div className="space-y-2">
            <p>Signal Visiblity</p>
            <Select
              value={signalVisibility}
              onValueChange={(value) => {
                const nextSignal = value as "private" | "public";
                setSignalVisibility(nextSignal);
                void saveVisibility(nextSignal, emailVisibility);
              }}
              disabled={isSavingVisibility}
            >
              <SelectTrigger
                id="signal-visibility"
                className="w-full sm:min-w-64"
              >
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Visible to only me</SelectItem>
                <SelectItem value="public">Visible to anyone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p>Email Visibility</p>
            <Select
              value={emailVisibility}
              onValueChange={(value) => {
                const nextEmail = value as "private" | "public";
                setEmailVisibility(nextEmail);
                void saveVisibility(signalVisibility, nextEmail);
              }}
              disabled={isSavingVisibility}
            >
              <SelectTrigger
                id="email-visibility"
                className="w-full sm:min-w-64"
              >
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Visible to only me</SelectItem>
                <SelectItem value="public">Visible to anyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mt-5">
        <Button
          type="button"
          className="inline-flex items-center gap-2 px-6"
          disabled={isCreateAccount}
          onClick={handleCreateAccount}
          aria-label="Create a new account"
        >
          {isCreateAccount && <Spinner />}
          Create Account
        </Button>
      </div>
    </div>
  );
}
