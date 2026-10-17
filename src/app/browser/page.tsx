import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Cloud Browser | OperatSI Console",
  description: "Isolated cloud container browser instances for automated web actions.",
};

export default function CloudBrowserPage() {
  const item = ALL_MENU_ITEMS["/browser"];
  return (
    <AppLayout activeRoute="/browser">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
