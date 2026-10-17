import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Operatsi AI | OperatSI Console",
  description: "Enterprise multi-agent chat interface with contextual memory and tool use.",
};

export default function OperatsiAiPage() {
  const item = ALL_MENU_ITEMS["/ai"];
  return (
    <AppLayout activeRoute="/ai">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
