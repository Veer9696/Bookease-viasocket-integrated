import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";
import Button from "../common/Button";

const linkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium rounded-full ${isActive ? "bg-primary-light text-primary" : "text-gray-600 hover:text-primary"}`;

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-primary">
          BookEase
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/doctors" className={linkClass}>Doctors</NavLink>
          <NavLink to="/lab-tests" className={linkClass}>Lab Tests</NavLink>
          {user?.role === "PATIENT" && <NavLink to="/dashboard" className={linkClass}>My Dashboard</NavLink>}
          {user?.role === "DOCTOR" && <NavLink to="/doctor/dashboard" className={linkClass}>Doctor Dashboard</NavLink>}
          {(user?.role === "DOCTOR" || user?.role === "ADMIN") && (
            <NavLink to="/automations" className={linkClass}>Automations</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <span className="hidden text-sm text-gray-600 sm:inline">{user.name}</span>
              <Button variant="ghost" onClick={logout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary">Log in</Link>
              <Link to="/register"><Button>Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
