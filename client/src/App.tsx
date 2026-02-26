import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePushNotifications } from "./hooks/usePushNotifications";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Convoys from "./pages/Convoys";
import BlackBook from "./pages/BlackBook";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Verification from "./pages/Verification";
import CDLVerification from "./pages/CDLVerification";
import Admin from "./pages/Admin";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/feed"} component={Feed} />
      <Route path={"/explore"} component={Explore} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/bookmarks"} component={Bookmarks} />
      <Route path={"/convoys"} component={Convoys} />
      <Route path={"/blackbook"} component={BlackBook} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/profile/:handle"} component={Profile} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/verification"} component={Verification} />
      <Route path={"/cdl-verification"} component={CDLVerification} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize push notifications
  usePushNotifications();

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
