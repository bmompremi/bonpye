import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileBottomNav from "./components/MobileBottomNav";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePushNotifications } from "./hooks/usePushNotifications";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Squads from "./pages/Squads";
import Grounds from "./pages/Grounds";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Verification from "./pages/Verification";
import PlayerVerification from "./pages/PlayerVerification";
import Admin from "./pages/Admin";
import Clubs from "./pages/Clubs";
import ClubDetail from "./pages/ClubDetail";
import Matches from "./pages/Matches";
import Scouting from "./pages/Scouting";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/feed"} component={Feed} />
      <Route path={"/explore"} component={Explore} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/bookmarks"} component={Bookmarks} />
      <Route path={"/squads"} component={Squads} />
      <Route path={"/grounds"} component={Grounds} />
      <Route path={"/clubs"} component={Clubs} />
      <Route path={"/clubs/:slug"} component={ClubDetail} />
      <Route path={"/matches"} component={Matches} />
      <Route path={"/scouting"} component={Scouting} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/profile/:handle"} component={Profile} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/verification"} component={Verification} />
      <Route path={"/player-verification"} component={PlayerVerification} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  usePushNotifications();

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <div className="pb-16 md:pb-0">
            <Router />
          </div>
          <MobileBottomNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
