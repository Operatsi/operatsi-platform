import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Inbox | OperatSI Console",
  description: "Unified notifications, human-in-the-loop approvals, and agent alerts.",
};

export default function InboxPage() {
  const item = ALL_MENU_ITEMS["/inbox"];
  return (
    <AppLayout activeRoute="/inbox">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
