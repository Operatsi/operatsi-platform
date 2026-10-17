import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Nano Agents | OperatSI Console",
  description: "High-density autonomous nano-agent cluster orchestration and lifecycle control.",
};

export default function AgentsPage() {
  const item = ALL_MENU_ITEMS["/agents"];
  return (
    <AppLayout activeRoute="/agents">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
