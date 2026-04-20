import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid, TaskTable } from "@/components/dashboard/Widgets";

const ProductionDashboard = () => (
  <DashboardLayout dept="Digital Production" title="Render & Broadcast Operations">
    <StatsGrid stats={[
      { label: "Active Renders", value: "6", meta: "GPU 82%", tone: "amber" },
      { label: "In Edit Bay", value: "14", meta: "3 urgent", tone: "red" },
      { label: "Delivered 24h", value: "21", meta: "AVG 1h12m", tone: "muted" },
      { label: "Asset Library", value: "1.4K", meta: "+38 today", tone: "green" },
    ]}/>
    <TaskTable title="Production Pipeline" tasks={[
      { id: "PRD-2280", title: "Election Live Stream — D4", sub: "Multicam ingest · live", tag: "LIVE", status: "Processing", deadline: "14:45" },
      { id: "PRD-2271", title: "Documentary Cold Open Edit", sub: "Color grade pending", tag: "DOC", status: "Reviewing", deadline: "Today" },
      { id: "PRD-2255", title: "Sponsor Spot v3", sub: "Final master render", tag: "AD", status: "Staged", deadline: "20:00" },
    ]}/>
  </DashboardLayout>
);
export default ProductionDashboard;
