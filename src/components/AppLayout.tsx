import { Link, useLocation } from "react-router-dom";
import { 
  Upload, List, BarChart3, Hash, TrendingUp, 
  Triangle, Lightbulb, Crown, Gamepad2, Clover
} from "lucide-react";

const navItems = [
  { path: "/", label: "Importar Resultados", icon: Upload },
  { path: "/concursos", label: "Concursos", icon: List },
  { path: "/analise", label: "Análise das Dezenas", icon: BarChart3 },
  { path: "/pares-impares", label: "Pares e Categorias", icon: Hash },
  { path: "/somas", label: "Somas, Linhas e Colunas", icon: TrendingUp },
  { path: "/trincas", label: "Trincas Frequentes", icon: Triangle },
  { path: "/prospeccao", label: "Prospecção Inteligente", icon: Lightbulb },
  { path: "/jogos", label: "Jogos Gerados", icon: Gamepad2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Clover className="h-7 w-7 text-sidebar-primary" />
            <div>
              <h1 className="font-heading text-base font-bold text-sidebar-foreground leading-tight">
                Lotofácil
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-medium tracking-wider uppercase">
                Analisador Inteligente
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
