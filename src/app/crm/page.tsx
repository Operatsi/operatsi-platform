import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "CRM & Sales | OperatSI Console",
  description: "Autonomous CRM prospecting, lead enrichment, and sales pipeline management.",
};

export default function CrmPage() {
  const item = ALL_MENU_ITEMS["/crm"];
  return (
    <AppLayout activeRoute="/crm">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
