import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScientificTooltip } from './ScientificTooltip';

export interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tooltip?: string;
  scientificCitation?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  tooltip = '',
  scientificCitation
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border border-slate-800 rounded bg-slate-900/50 mb-2 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-2 bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer w-full text-left"
        title={tooltip}
      >
        <div className="flex items-center gap-1.5">
          <h2 className="text-[10px] uppercase tracking-widest text-slate-300 font-bold flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {tooltip && (
            <ScientificTooltip
              title={title}
              content={tooltip}
              citation={scientificCitation || 'Metodología EIDUNED'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 inline-block" />
            </ScientificTooltip>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
      </button>
      {isOpen && (
        <div className="p-2 border-t border-slate-800 bg-black/20">
          {children}
        </div>
      )}
    </div>
  );
};
