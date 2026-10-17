import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Planning | OperatSI Console",
  description: "Strategic planning, objective decomposition, and milestone alignment.",
};

export default function PlanningPage() {
  const item = ALL_MENU_ITEMS["/planning"];
  return (
    <AppLayout activeRoute="/planning">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
