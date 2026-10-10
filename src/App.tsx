import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Host from "./pages/Host";
import Join from "./pages/Join";
import Player from "./pages/Player";
import Display from "./pages/Display";
import { PartyThemeProvider } from "./components/PartyLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PartyThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/host" element={<Host />} />
            <Route path="/join" element={<Join />} />
            <Route path="/play" element={<Join />} />
            <Route path="/player/:roomCode" element={<Player />} />
            <Route path="/display/:roomCode" element={<Display />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PartyThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;