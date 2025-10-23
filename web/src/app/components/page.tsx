import { SelectableButton } from "@/components/buttons";
import Navigation from "@/components/navigation";

const Components = () => {
  return (
    <div id="components">
      <Navigation />
      <div className="flex flex-1 items-center justify-center h-screen">
        <SelectableButton text="New Post" icon="add" />
      </div>
    </div>
  );
};

export default Components;
