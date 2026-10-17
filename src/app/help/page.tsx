import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { HELP_MENU_ITEM } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Help & Support | OperatSI Console",
  description: "Documentation, API specifications, developer support, and enterprise SLA assistance.",
};

export default function HelpPage() {
  return (
    <AppLayout activeRoute="/help">
      <ComingSoonView item={HELP_MENU_ITEM} />
    </AppLayout>
  );
}
