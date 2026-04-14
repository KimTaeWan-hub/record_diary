import Sidebar from "./components/Sidebar";
import CalendarView from "./components/CalendarView";

export default function Home() {
  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <CalendarView />
      </main>
    </div>
  );
}
