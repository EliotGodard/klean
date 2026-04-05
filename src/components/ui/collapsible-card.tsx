"use client";

import * as React from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleCard({
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleCardProps) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <div
        data-slot="card"
        className={cn(
          "group/card flex flex-col overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10",
          className
        )}
      >
        <Collapsible.Trigger className="flex items-center gap-2 px-4 py-3 cursor-pointer text-left">
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-panel-open]_&]:rotate-90" />
          <span className="font-heading text-base leading-snug font-medium">
            {title}
          </span>
        </Collapsible.Trigger>
        <Collapsible.Panel className="overflow-hidden transition-all duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0">
          <div data-slot="card-content" className="px-4 pb-4">
            {children}
          </div>
        </Collapsible.Panel>
      </div>
    </Collapsible.Root>
  );
}
