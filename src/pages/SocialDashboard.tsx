import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid, TaskTable } from "@/components/dashboard/Widgets";

const SocialDashboard = () => (
  <DashboardLayout dept="Social Media Desk" title="Campaign & Engagement Control">
    <StatsGrid stats={[
      { label: "Scheduled Posts", value: "48", meta: "+8 today", tone: "green" },
      { label: "In Review", value: "12", meta: "HI-PRI", tone: "amber" },
      { label: "Published 24h", value: "96", meta: "AVG 18m", tone: "muted" },
      { label: "Engagement Rate", value: "7.2%", meta: "+0.4%", tone: "green" },
    ]}/>
    <TaskTable title="Social Dispatch Queue" tasks={[
      { id: "SOC-9012", title: "Election Coverage: Reels Pack", sub: "10-clip series · Instagram + TikTok", tag: "REELS", status: "Processing", deadline: "14:45" },
      { id: "SOC-9009", title: "Housing Crisis Infographics", sub: "Carousel render queue", tag: "CARD", status: "Staged", deadline: "16:00" },
      { id: "SOC-9001", title: "Daily Ausaf Front Page Tease", sub: "Cross-post to X / Threads", tag: "X", status: "Reviewing", deadline: "15:10" },
    ]}/>
  </DashboardLayout>
);
export default SocialDashboard;
