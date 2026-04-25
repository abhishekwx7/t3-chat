"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Info,
  Scroll,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import React from "react";

export function ModelSelector({
  models,
  selectedModelId,
  onModelSelect,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const formatContextLength = (length) => {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  const isFreeModel = (model) => {
    return (
      model.pricing.prompt === "0" &&
      model.pricing.completion === "0" &&
      model.pricing.request === "0"
    );
  };

  const openModelDetails = (model, e) => {
    e.stopPropagation();
    setSelectedForDetails(model);
    setDetailsOpen(true);
  };

  const filteredModels = models.filter((model) => {
    const query = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      model.architecture.modality.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-8 justify-between gap-2 px-2 text-xs hover:bg-accent",
              className,
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">
                {selectedModel?.name || "Select model"}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className={"w-3xl p-0"} align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>

          <ScrollArea className={"h-100"}>
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Available Models ({filteredModels.length})
              </div>
            </div>
            {filteredModels.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                No models found matching "{searchQuery}"
              </div>
            ) : (
              filteredModels.map((model) => (
                <div
                  key={model.id}
                  className={cn(
                    "relative flex cursor-pointer select-none items-start gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    selectedModelId === model.id && "bg-accent",
                  )}
                  onClick={() => {
                    onModelSelect(model.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex h-5 items-center">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedModelId === model.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm leading-none truncate">
                        {model.name}
                      </span>
                      {isFreeModel(model) && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[10px]"
                        >
                          FREE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>
                        Context: {formatContextLength(model.context_length)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {model.architecture.modality.replace("->", " → ")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={(e) => openModelDetails(model, e)}
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span className="sr-only">View details</span>
                  </Button>
                </div>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
