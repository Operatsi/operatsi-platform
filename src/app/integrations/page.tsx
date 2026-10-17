import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Integrations | OperatSI Console",
  description: "Connect APIs, webhooks, GitHub, Slack, Notion, and cloud databases.",
};

export default function IntegrationsPage() {
  const item = ALL_MENU_ITEMS["/integrations"];
  return (
    <AppLayout activeRoute="/integrations">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
