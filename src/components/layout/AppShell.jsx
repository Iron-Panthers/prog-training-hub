import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CosmeticAvatar from "@/components/CosmeticAvatar";
import redLogo from "@/assets/redLogo.svg";
import {
  Home, BookOpen, Code2, LayoutDashboard,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
  ClipboardList, Megaphone
} from "lucide-react";

const studentNav = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Units", icon: BookOpen, path: "/units" },
  { label: "Sandbox IDE", icon: Code2, path: "/sandbox" },
];

const adminNav = [
  { label: "Admin Home", icon: LayoutDashboard, path: "/admin" },
  { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  { label: "Submissions", icon: ClipboardList, path: "/admin/submissions" },
  { label: "Manage Units", icon: BookOpen, path: "/admin/units" },
];

export default function AppShell({ user, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut, profile, getAvatarUrl } = useAuth();
  const isAdmin = user?.role === "admin";
  const nav = isAdmin ? adminNav : studentNav;

  const NavItem = ({ item }) => {
    const active = location.pathname === item.path ||
      (item.path !== "/dashboard" && item.path !== "/admin" && location.pathname.startsWith(item.path));
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
          active
            ? "bg-primary text-white shadow-lg shadow-primary/30"
            : "text-white/60 hover:text-white hover:bg-white/10"
        }`}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-white/60 group-hover:text-white"}`} />
        {(!collapsed || mobileOpen) && (
          <span className="text-sm font-medium truncate">{item.label}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed && !mobile ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-primary border border-primary/50 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <img src={redLogo} alt="Logo" className="w-7 h-7" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <p className="text-white font-black text-sm leading-none">Iron Panthers</p>
            <p className="text-primary text-xs font-medium mt-0.5">FRC Team 5026</p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {(!collapsed || mobile) && (
        <div className="px-4 pt-4">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center ${
            isAdmin ? "bg-gold/20 text-gold border border-gold/30" : "bg-accent/20 text-blue-300 border border-accent/30"
          }`}>
            {isAdmin ? "⚡ Admin" : "🎓 Student"}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => <NavItem key={item.path} item={item} />)}
        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              <div className={`text-white/20 text-xs font-semibold uppercase tracking-wider px-3 ${collapsed && !mobile ? "text-center" : ""}`}>
                {(!collapsed || mobile) ? "Student View" : "·"}
              </div>
            </div>
            {studentNav.map((item) => <NavItem key={`s-${item.path}`} item={item} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <Link
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            title="Settings"
          >
            <CosmeticAvatar
              avatarUrl={getAvatarUrl()}
              userName={profile?.name || "User"}
              size="sm"
            />
            {(!collapsed || mobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{profile?.name}</p>
                <p className="text-white/40 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </Link>
          <button
            onClick={signOut}
            className="text-white/40 hover:text-primary transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-navy border-r border-white/10 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full ml-px w-5 h-10 bg-navy border border-white/10 rounded-r-lg flex items-center justify-center text-white/40 hover:text-white transition-colors z-20"
          style={{ left: collapsed ? "3.5rem" : "14.5rem" }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 h-14 bg-navy border-b border-white/10 flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2">
              <img src={redLogo} alt="Logo" className="w-7 h-7" />
              <span className="text-white font-black text-sm">Iron Panthers</span>
            </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-20 pt-14">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-14 bottom-0 w-72 bg-navy shadow-2xl">
              <SidebarContent mobile />
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
