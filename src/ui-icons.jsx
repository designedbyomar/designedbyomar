import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Box, Check, ChevronDown, Copy, Menu, Moon, NotebookPen, Palette, RefreshCcw, Rocket, Search, ShieldCheck, Sparkles, Sun, Target, Type, X, Zap } from 'lucide-react';

export { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Box, Check, ChevronDown, Copy, Menu, Moon, NotebookPen, Palette, RefreshCcw, Rocket, Search, ShieldCheck, Sparkles, Sun, Target, Type, X, Zap };

export const AppIcon = ({ icon: Icon, size = 16, strokeWidth = 2, ...props }) => (
  <Icon
    size={size}
    strokeWidth={strokeWidth}
    absoluteStrokeWidth
    aria-hidden="true"
    {...props}
  />
);
