import Link from "next/link";
import { Shield, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="relative w-full overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 dot-grid" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />

        <div className="container relative flex flex-col items-center gap-8 pt-32 pb-20 text-center">
          {/* Shield icon with glow */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 blue-glow mb-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-primary bg-clip-text text-transparent leading-[1.1]">
            AgentShield
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            Mission control for AI agent vaults on Solana. Monitor
            activity, manage policies, and hit the kill switch — all
            on-chain.
          </p>

          {/* Search */}
          <div className="w-full max-w-lg">
            <GlobalSearch />
          </div>

          {/* CTAs */}
          <div className="flex gap-4 pt-2">
            <Button asChild size="lg">
              <Link href="/create">Create Vault</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/explore">Explore Vaults</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container grid gap-6 md:grid-cols-3 py-20">
        {[
          {
            icon: Shield,
            title: "Permission Controls",
            desc: "Configurable spending caps, token whitelists, protocol restrictions, and leverage limits per vault.",
          },
          {
            icon: BarChart3,
            title: "Real-time Monitoring",
            desc: "Live WebSocket updates for vault balances, spending progress, and agent activity feed.",
          },
          {
            icon: Zap,
            title: "Kill Switch",
            desc: "Instantly freeze any vault with one click. Revoke agent access and protect your funds.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="group flex flex-col items-center text-center gap-4 p-8 rounded-xl bg-card/80 backdrop-blur-xl border border-white/[0.06] transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,102,255,0.08)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
