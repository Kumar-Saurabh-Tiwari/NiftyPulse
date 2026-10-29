import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Moon,
  Sun,
  Search,
  BriefcaseBusiness,
  Settings2,
  X,
  Layout,
  Zap,
  Bell,
  UserRound,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Theme } from '@/lib/types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenFunds: () => void;
  fundPins: number[];
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  compactMode: boolean;
  onToggleCompactMode: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export function Header({
  theme,
  onToggleTheme,
  onOpenSearch,
  onOpenFunds,
  fundPins,
  autoRefresh,
  onToggleAutoRefresh,
  compactMode,
  onToggleCompactMode,
  reducedMotion,
  onToggleReducedMotion,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-card border-b border-t-0 border-x-0">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700"
            >
              <Activity className="h-5 w-5 text-white" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </motion.div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight tracking-tight md:text-xl">
                Nifty<span className="gradient-text-bull">Pulse</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Indian Markets Live
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFunds}
              className="gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground sm:px-3 sm:text-sm"
            >
              <BriefcaseBusiness className="h-4 w-4 text-emerald-500" />
              <span>Your Funds</span>
              {fundPins.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] text-white">
                  {fundPins.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSearch}
              className="glass-card gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground md:text-sm"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
                ⌘K
              </kbd>
            </Button>

            <Badge
              variant="outline"
              className="hidden gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-500 md:flex"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              LIVE
            </Badge>

            <button
              type="button"
              aria-label="Open personalization settings"
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((open) => !open);
              }}
              className={`glass-card flex h-9 w-9 items-center justify-center rounded-lg transition ${
                settingsOpen ? 'text-emerald-500 ring-1 ring-emerald-500/30' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings2 className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <motion.button
              onClick={onToggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card relative flex h-9 w-9 items-center justify-center rounded-lg"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Moon className="h-4 w-4 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Sun className="h-4 w-4 text-amber-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close personalization settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="fixed inset-0 z-40 cursor-default bg-slate-950/30 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '100%', opacity: 0.7 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.7 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Personalization settings"
              className="liquid-glass-drawer fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md transform-gpu flex-col overflow-hidden will-change-transform"
            >
              <div className="liquid-glass-orb liquid-glass-orb-one" />
              <div className="liquid-glass-orb liquid-glass-orb-two" />
              <div className="relative z-10 flex items-center justify-between border-b border-white/30 px-5 py-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-base font-bold">Personalize NiftyPulse</p>
                  <p className="text-[10px] text-muted-foreground">Your preferences are saved on this device.</p>
                </div>
                </div>
                <button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative z-10 flex-1 space-y-5 overflow-y-auto p-5">
                <section className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account</p>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Guest profile</p>
                    <p className="text-[10px] text-muted-foreground">Sign in to sync your preferences</p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">Soon</Badge>
                </div>
                </section>
                <section className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dashboard</p>
                <SettingRow icon={<Zap className="h-4 w-4 text-emerald-500" />} label="Automatic market refresh" description="Refresh live quotes every 30 seconds" enabled={autoRefresh} onToggle={onToggleAutoRefresh} />
                <SettingRow icon={<Layout className="h-4 w-4 text-sky-500" />} label="Compact dashboard" description="Use tighter spacing for more information" enabled={compactMode} onToggle={onToggleCompactMode} />
                <SettingRow icon={<Activity className="h-4 w-4 text-amber-500" />} label="Reduced motion" description="Minimize animated transitions and scrolling" enabled={reducedMotion} onToggle={onToggleReducedMotion} />
                </section>
                <section className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alerts</p>
                <ComingSoonRow icon={<Bell className="h-4 w-4 text-violet-500" />} label="Notifications" description="Get alerts for market and fund movements" />
                <ComingSoonRow icon={<Bell className="h-4 w-4 text-rose-500" />} label="Price alerts" description="Set custom alerts for your watchlist" />
                </section>
                <section className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Appearance</p>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div><p className="text-xs font-semibold">Theme</p><p className="text-[10px] text-muted-foreground">Current theme: {theme}</p></div>
                  <button type="button" onClick={onToggleTheme} className="rounded-lg bg-background px-3 py-1.5 text-[10px] font-semibold capitalize shadow-sm">{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</button>
                </div>
                </section>
              </div>
              <div className="relative z-10 border-t border-white/30 px-5 py-3 text-center text-[10px] text-muted-foreground dark:border-white/10">
                NiftyPulse · Personal dashboard
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function SettingRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-left transition hover:border-emerald-500/30">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{label}</span><span className="block text-[10px] text-muted-foreground">{description}</span></span>
      <span className={`relative h-5 w-9 rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}><span className={`absolute top-1 h-3 w-3 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} /></span>
    </button>
  );
}

function ComingSoonRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 opacity-80">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{description}</span>
      </span>
      <Badge variant="outline" className="shrink-0 text-[9px]">Coming soon</Badge>
    </div>
  );
}
