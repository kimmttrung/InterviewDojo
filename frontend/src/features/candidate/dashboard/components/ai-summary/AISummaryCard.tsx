import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/ui/card';
import { AISummaryContent } from './AISummaryContent';

// ============================================================
// TYPES
// ============================================================

export type AISummary = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  comment: string;
};

type AISummaryCardProps = {
  summary: AISummary;
};

type SummaryListProps = {
  title: string;
  items: string[];
  icon: React.ElementType;
  variant: keyof typeof variantStyles;
};

// ============================================================
// STYLES
// ============================================================

const variantStyles = {
  success: {
    accent: 'bg-emerald-500',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },

  danger: {
    accent: 'bg-rose-500',
    icon: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },

  warning: {
    accent: 'bg-amber-500',
    icon: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
};

// ============================================================
// SUMMARY LIST
// ============================================================

const SummaryList = ({ title, items, icon: Icon, variant }: SummaryListProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl
        border bg-background
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      {/* Accent line */}
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.accent}`} />

      <div className="p-5">
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl bg-muted
                transition-colors
                group-hover:bg-muted/80
              "
            >
              <Icon className={`h-5 w-5 ${styles.icon}`} />
            </div>

            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>

              <p className="text-xs text-muted-foreground">{items?.length || 0} items</p>
            </div>
          </div>

          <div
            className={`
              rounded-full px-2.5 py-1
              text-xs font-semibold
              ${styles.badge}
            `}
          >
            AI Summary
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-2">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={index}
                className="
                  rounded-xl border
                  bg-muted/40
                  px-3 py-3 text-sm
                  text-foreground/90
                  transition-colors
                  hover:bg-muted
                "
              >
                {item}
              </div>
            ))
          ) : (
            <div
              className="
                rounded-xl border border-dashed
                px-3 py-6 text-center text-sm
                text-muted-foreground
              "
            >
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// AI SUMMARY CARD
// ============================================================

export const AISummaryCard = ({ summary }: AISummaryCardProps) => {
  return (
    <Card className="border bg-background shadow-sm">
      <CardContent className="space-y-6 p-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-11 w-11 items-center justify-center
              rounded-2xl
              bg-primary text-primary-foreground
              shadow-md
            "
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Summary</h2>

            <p className="text-sm text-muted-foreground">Personalized learning insights</p>
          </div>
        </div>

        {/* COMMENT */}
        <div
          className="
            rounded-2xl border bg-muted/30
            p-5
          "
        >
          <AISummaryContent content={summary.comment} />
        </div>

        {/* GRID */}
        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryList
            title="Strengths"
            items={summary.strengths}
            icon={TrendingUp}
            variant="success"
          />

          <SummaryList
            title="Weaknesses"
            items={summary.weaknesses}
            icon={AlertTriangle}
            variant="danger"
          />

          <SummaryList
            title="Suggestions"
            items={summary.suggestions}
            icon={Lightbulb}
            variant="warning"
          />
        </div>
      </CardContent>
    </Card>
  );
};
