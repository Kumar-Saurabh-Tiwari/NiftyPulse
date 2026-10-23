import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Theme } from '@/lib/types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
}

export function Header({ theme, onToggleTheme, onOpenSearch }: HeaderProps) {
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
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4 w-4 text-amber-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
