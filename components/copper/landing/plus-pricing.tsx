import { PlanPicker } from "@/components/copper/landing/plan-picker";
import { getPlans } from "@/lib/copper/catalog";

export function PlusPricing() {
  return (
    <section
      id="plus"
      data-testid="plus-pricing"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 md:py-24"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Free, or Copper Plus</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Every Copper works on the Free plan. Copper Plus remembers more,
          records more and refines its answers. Switch how you pay, then pick
          your plan.
        </p>
      </div>

      <PlanPicker plans={getPlans()} />
    </section>
  );
}
