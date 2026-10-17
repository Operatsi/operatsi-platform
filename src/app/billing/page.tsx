import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Billing & Usage | OperatSI Console",
  description: "Subscription tier, compute quota, invoice management, and usage trends.",
};

export default function BillingPage() {
  const item = ALL_MENU_ITEMS["/billing"];
  return (
    <AppLayout activeRoute="/billing">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
