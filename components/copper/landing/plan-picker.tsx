"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatMemory,
  formatNotesHours,
  formatUsd,
  type Plan,
} from "@/lib/copper/catalog";
import { cn } from "@/lib/utils";

export type Billing = "monthly" | "yearly" | "compare";

const BILLING: { id: Billing; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "compare", label: "Compare" },
];

const cents = (amount: number) => Math.round(amount * 100) / 100;

/** What a year costs each way, and what yearly billing saves. */
export function yearlyMath(plan: Plan) {
  const monthlyForAYear = cents(plan.monthlyUsd * 12);
  return {
    monthlyForAYear,
    perMonthOnYearly: cents(plan.annualUsd / 12),
    savings: cents(monthlyForAYear - plan.annualUsd),
  };
}

// Pick a billing view and a plan; the summary shows the customer's choice.
// Every number comes from the catalog plans passed in by <PlusPricing />.
export function PlanPicker({ plans }: { plans: Plan[] }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pickedId, setPickedId] = useState<Plan["id"] | null>(null);
  const picked = plans.find((plan) => plan.id === pickedId);

  return (
    <div className="flex flex-col items-center gap-10">
      <div
        role="group"
        aria-label="Billing"
        className="bg-secondary inline-flex gap-1 rounded-xl p-1"
      >
        {BILLING.map((option) => (
          <Button
            key={option.id}
            variant={billing === option.id ? "default" : "ghost"}
            aria-pressed={billing === option.id}
            onClick={() => setBilling(option.id)}
            className="h-9 px-4 text-sm sm:px-6"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const isPicked = plan.id === pickedId;
          return (
            <div
              key={plan.id}
              data-plan={plan.id}
              data-picked={isPicked}
              className={cn(
                "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl p-8 ring-1 transition-shadow",
                isPicked
                  ? "ring-primary shadow-xl ring-2"
                  : plan.id === "copper-plus"
                    ? "ring-primary/50"
                    : "ring-foreground/10",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h3 className="text-2xl font-bold whitespace-nowrap">
                  {plan.name}
                </h3>
                <div className="flex gap-2">
                  {plan.id === "copper-plus" && (
                    <Badge variant="secondary">Most popular</Badge>
                  )}
                  {isPicked && <Badge>Your pick</Badge>}
                </div>
              </div>

              <PlanPrice plan={plan} billing={billing} />

              <dl className="flex flex-col gap-3 border-t pt-6">
                <Row
                  label="Memory kept"
                  value={formatMemory(plan.memoryDays)}
                />
                <Row
                  label="Notes recording"
                  value={formatNotesHours(plan.notesHoursPerMonth)}
                />
                <Row
                  label="Refined answers"
                  value={plan.refinedAnswers ? "Included" : "Not included"}
                />
              </dl>

              <Button
                variant={isPicked ? "default" : "outline"}
                aria-pressed={isPicked}
                onClick={() => setPickedId(plan.id)}
                className="mt-auto h-11 text-base"
              >
                {isPicked ? `${plan.name} selected` : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <Summary plan={picked} billing={billing} />
    </div>
  );
}

function PlanPrice({ plan, billing }: { plan: Plan; billing: Billing }) {
  const { monthlyForAYear, perMonthOnYearly, savings } = yearlyMath(plan);

  if (billing === "compare") {
    return (
      <dl className="bg-secondary text-secondary-foreground flex flex-col gap-2 rounded-xl p-4">
        <Row
          label="Monthly for a year"
          value={`${formatUsd(plan.monthlyUsd)} × 12 = ${formatUsd(monthlyForAYear)}`}
        />
        <Row label="Yearly" value={`${formatUsd(plan.annualUsd)}/year`} />
        <Row
          label="Yearly saves"
          value={savings > 0 ? formatUsd(savings) : "Nothing to save"}
        />
      </dl>
    );
  }

  const yearly = billing === "yearly";
  return (
    <div>
      <p className="text-4xl font-bold">
        {formatUsd(yearly ? plan.annualUsd : plan.monthlyUsd)}
        <span className="text-muted-foreground text-base font-medium">
          {yearly ? "/year" : "/month"}
        </span>
      </p>
      <p className="text-muted-foreground mt-1">
        {yearly
          ? savings > 0
            ? `about ${formatUsd(perMonthOnYearly)}/month · save ${formatUsd(savings)} a year`
            : `or ${formatUsd(plan.monthlyUsd)}/month`
          : `or ${formatUsd(plan.annualUsd)}/year`}
      </p>
    </div>
  );
}

function Summary({ plan, billing }: { plan?: Plan; billing: Billing }) {
  return (
    <div
      data-testid="plan-summary"
      aria-live="polite"
      className="bg-secondary text-secondary-foreground w-full max-w-4xl rounded-2xl p-6 sm:p-8"
    >
      {plan ? (
        <SummaryDetails plan={plan} billing={billing} />
      ) : (
        <p className="text-center text-lg">
          Choose a plan above to see your summary.
        </p>
      )}
    </div>
  );
}

function SummaryDetails({ plan, billing }: { plan: Plan; billing: Billing }) {
  const { savings } = yearlyMath(plan);
  const price =
    billing === "monthly"
      ? `billed monthly: ${formatUsd(plan.monthlyUsd)}/month`
      : billing === "yearly"
        ? `billed yearly: ${formatUsd(plan.annualUsd)}/year`
        : `${formatUsd(plan.monthlyUsd)}/month or ${formatUsd(plan.annualUsd)}/year`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-primary text-sm font-semibold tracking-widest uppercase">
          Your plan
        </p>
        <p className="mt-1 text-2xl font-bold">
          {plan.name}, {price}
        </p>
        <p className="text-muted-foreground mt-2">
          {formatMemory(plan.memoryDays)} of memory ·{" "}
          {formatNotesHours(plan.notesHoursPerMonth)} Notes recording ·{" "}
          {plan.refinedAnswers ? "Refined answers" : "No Refined answers"}
          {billing !== "monthly" && savings > 0
            ? ` · yearly saves ${formatUsd(savings)}`
            : ""}
        </p>
      </div>
      <Button asChild size="lg" className="h-11 shrink-0 px-6 text-base">
        <a href="#products">See products</a>
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
