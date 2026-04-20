import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid, TaskTable } from "@/components/dashboard/Widgets";

const WebsiteDashboard = () => (
  <DashboardLayout dept="Website Desk" title="Editorial & Publishing Pipeline">
    <StatsGrid stats={[
      { label: "Drafts Open", value: "27", meta: "12 stale", tone: "amber" },
      { label: "Pending Review", value: "9", meta: "HI-PRI", tone: "amber" },
      { label: "Published 24h", value: "42", meta: "AVG 38m", tone: "muted" },
      { label: "Page CTR", value: "4.1%", meta: "+0.2%", tone: "green" },
    ]}/>
    <TaskTable title="Editorial Queue" tasks={[
      { id: "WEB-4421", title: "Annual Tech Summit Recap", sub: "Long-form · awaiting sign-off", tag: "FEATURE", status: "Reviewing", deadline: "15:10" },
      { id: "WEB-4419", title: "High-Speed Rail Debate", sub: "Interactive feature · QA pass", tag: "INTER", status: "Processing", deadline: "17:30" },
      { id: "WEB-4404", title: "Op-Ed: Media Literacy", sub: "Copy edit complete", tag: "OPED", status: "Staged", deadline: "Tomorrow" },
    ]}/>
  </DashboardLayout>
);
export default WebsiteDashboard;
