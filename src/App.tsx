import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import ImportarPage from "@/pages/ImportarPage";
import ConcursosPage from "@/pages/ConcursosPage";
import AnalisePage from "@/pages/AnalisePage";
import ParesImparesPage from "@/pages/ParesImparesPage";
import SomasPage from "@/pages/SomasPage";
import TrincasPage from "@/pages/TrincasPage";
import ProspeccaoPage from "@/pages/ProspeccaoPage";
import JogosPage from "@/pages/JogosPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<ImportarPage />} />
            <Route path="/concursos" element={<ConcursosPage />} />
            <Route path="/analise" element={<AnalisePage />} />
            <Route path="/pares-impares" element={<ParesImparesPage />} />
            <Route path="/somas" element={<SomasPage />} />
            <Route path="/trincas" element={<TrincasPage />} />
            <Route path="/prospeccao" element={<ProspeccaoPage />} />
            <Route path="/jogos" element={<JogosPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
