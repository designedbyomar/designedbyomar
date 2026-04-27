import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Menu, Moon, Sun, X } from 'lucide-react';

export { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Menu, Moon, Sun, X };

export const AppIcon = ({ icon: Icon, size = 16, strokeWidth = 2, ...props }) => (
  <Icon
    size={size}
    strokeWidth={strokeWidth}
    absoluteStrokeWidth
    aria-hidden="true"
    {...props}
  />
);
