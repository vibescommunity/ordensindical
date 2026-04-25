import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TerminalConsole } from "./TerminalConsole";
import { GridBackground } from "@/components/effects/GridBackground";
import { FloatingParticles } from "@/components/effects/FloatingParticles";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <div className="scanlines" style={{ minHeight: "100vh" }}>
      <GridBackground />
      <FloatingParticles count={15} />

      <Sidebar onToggleTerminal={() => setTerminalOpen(!terminalOpen)} />

      <div
        className="flex flex-col"
        style={{
          marginLeft: 260,
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Topbar title={title} />
        <main
          className="flex-1 page-enter"
          style={{
            padding: 24,
            paddingBottom: terminalOpen ? 274 : 24,
          }}
        >
          {children}
        </main>
      </div>

      <TerminalConsole
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
      />
    </div>
  );
}
