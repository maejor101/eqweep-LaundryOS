import { Menu, Search, User, LogOut, Settings, Crown, UserCheck, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Don't show header on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 160" className="h-12" aria-label="LaundryOS logo">
                <defs>
                  <style>{`.brand-dark{fill:#4d4d4d;stroke:none}.wordmark{font-family:"Poppins","Montserrat","Segoe UI","Arial",sans-serif;font-weight:600;font-size:76.8px;dominant-baseline:alphabetic}`}</style>
                  <mask id="m-door">
                    <rect width="120" height="120" rx="14" fill="#fff"/>
                    <circle cx="60" cy="60" r="28"/>
                  </mask>
                </defs>
                <g transform="translate(16 20)">
                  <rect width="120" height="120" rx="14" style={{stroke:'#4d4d4d', strokeWidth:10, strokeLinecap:'round', strokeLinejoin:'round', fill:'none'}}/>
                  <g mask="url(#m-door)">
                    <rect width="120" height="120" rx="14" fill="#fff"/>
                    <circle cx="60" cy="60" r="26" className="brand-dark"/>
                    <circle cx="60" cy="60" r="8" fill="#46b7b7"/>
                    <path d="M74 46a6 6 0 1 1-.1 0" fill="#46b7b7" opacity=".9"/>
                  </g>
                  <circle cx="102" cy="18" r="6" className="brand-dark"/>
                </g>
                <text className="wordmark" fill="#4d4d4d" transform="translate(160 95)">Laundry</text>
                <text x="290" className="wordmark" fill="#46b7b7" transform="translate(160 95)">OS</text>
              </svg>
            </Link>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="flex items-center gap-1">
            <NavLink
              to="/new-order"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              New Order
            </NavLink>
            <NavLink
              to="/process"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              Clean
            </NavLink>
            <NavLink
              to="/ready"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              Ready
            </NavLink>
            <NavLink
              to="/pickups"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              Pickups
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center mt-1">
                        {user?.role === 'admin' ? (
                          <div className="flex items-center text-xs text-purple-600">
                            <Crown className="h-3 w-3 mr-1" />
                            Administrator
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-blue-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Cashier
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/settings">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
