import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Menu, Moon, NotebookPen, Rocket, Sparkles, Sun, Target, X } from 'lucide-react';

export { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Menu, Moon, NotebookPen, Rocket, Sparkles, Sun, Target, X };

export const AppIcon = ({ icon: Icon, size = 16, strokeWidth = 2, ...props }) => (
  <Icon
    size={size}
    strokeWidth={strokeWidth}
    absoluteStrokeWidth
    aria-hidden="true"
    {...props}
  />
);
