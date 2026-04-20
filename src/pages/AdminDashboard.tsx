import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid, TaskTable } from "@/components/dashboard/Widgets";

const AdminDashboard = () => (
  <DashboardLayout dept="Super Admin" title="Newsroom Command Center">
    <StatsGrid stats={[
      { label: "Active Tasks", value: "142", meta: "+12%", tone: "green" },
      { label: "In Production", value: "28", meta: "HI-PRI", tone: "amber" },
      { label: "Completed 24h", value: "184", meta: "AVG 42m", tone: "muted" },
      { label: "Personnel Online", value: "37", meta: "ACTIVE", tone: "green" },
    ]}/>
    <TaskTable title="Cross-Desk Priority Queue" tasks={[
      { id: "TX-8802", title: "Election Coverage: District 4 Live Stream", sub: "Primary breaking news cycle", tag: "PROD", status: "Processing", deadline: "14:45" },
      { id: "TX-8799", title: "Web Feature: Annual Tech Summit Recap", sub: "Editorial review pending sign-off", tag: "WEB", status: "Reviewing", deadline: "15:10" },
      { id: "TX-8794", title: "Social Pack: Housing Crisis Infographics", sub: "Assets in render queue", tag: "SOC", status: "Staged", deadline: "16:00" },
      { id: "TX-8780", title: "Daily Ausaf — Print Sync to Web", sub: "Cross-publishing", tag: "WEB", status: "Done", deadline: "12:30" },
    ]}/>
  </DashboardLayout>
);
export default AdminDashboard;
