import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PlanPicker,
  yearlyMath,
} from "@/components/copper/landing/plan-picker";
import { getPlans, type Plan } from "@/lib/copper/catalog";

const plusCard = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-plan="copper-plus"]')!;

const summary = () => screen.getByTestId("plan-summary");

describe("Plan picker", () => {
  it("starts on monthly billing with no plan picked", () => {
    const { container } = render(<PlanPicker plans={getPlans()} />);
    expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(plusCard(container)).toHaveTextContent("$7.99/month");
    expect(plusCard(container)).toHaveTextContent("or $79/year");
    expect(summary()).toHaveTextContent("Choose a plan above");
  });

  it("Yearly shows the annual price, the monthly equivalent and the saving", () => {
    const { container } = render(<PlanPicker plans={getPlans()} />);
    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(screen.getByRole("button", { name: "Yearly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(plusCard(container)).toHaveTextContent("$79/year");
    expect(plusCard(container)).toHaveTextContent(
      "about $6.58/month · save $16.88 a year",
    );
  });

  it("Compare shows a year of monthly billing next to yearly billing", () => {
    const { container } = render(<PlanPicker plans={getPlans()} />);
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    const plus = plusCard(container);
    expect(plus).toHaveTextContent("$7.99 × 12 = $95.88");
    expect(plus).toHaveTextContent("Yearly saves$16.88");
    expect(container.querySelector('[data-plan="free"]')).toHaveTextContent(
      "Nothing to save",
    );
  });

  it("choosing a plan highlights it and the summary follows the billing", () => {
    const { container } = render(<PlanPicker plans={getPlans()} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose Copper Plus" }));

    expect(plusCard(container)).toHaveAttribute("data-picked", "true");
    expect(within(plusCard(container)).getByText("Your pick")).toBeVisible();
    expect(summary()).toHaveTextContent(
      "Copper Plus, billed monthly: $7.99/month",
    );
    expect(summary()).toHaveTextContent(
      "12 months of memory · Unlimited Notes recording · Refined answers",
    );

    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(summary()).toHaveTextContent("Copper Plus, billed yearly: $79/year");
    expect(summary()).toHaveTextContent("yearly saves $16.88");

    fireEvent.click(screen.getByRole("button", { name: "Choose Free" }));
    expect(plusCard(container)).toHaveAttribute("data-picked", "false");
    expect(summary()).toHaveTextContent("Free, billed yearly: $0/year");
    expect(summary()).toHaveTextContent("No Refined answers");
  });

  it("works out the yearly math from whatever the catalog says", () => {
    const plan = { monthlyUsd: 9.49, annualUsd: 95 } as Plan;
    expect(yearlyMath(plan)).toEqual({
      monthlyForAYear: 113.88,
      perMonthOnYearly: 7.92,
      savings: 18.88,
    });
  });
});
