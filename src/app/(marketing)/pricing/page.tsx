import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free / Self-Hosted",
    price: "$0",
    description: "Run MyInstaller on your own server. Full functionality, no restrictions.",
    badge: "Open Source",
    features: [
      "Unlimited deployment jobs",
      "All deployment profiles",
      "Full admin panel",
      "SSH & cloud-init automation",
      "Job queue & worker",
      "Audit logs",
      "Dry-run simulator",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29/mo",
    description: "For small teams managing multiple servers. Priority support included.",
    badge: "Coming Soon",
    features: [
      "Everything in Free",
      "Team workspaces",
      "Priority email support",
      "Advanced RBAC",
      "Scheduled deployments",
      "Webhook integrations",
      "Custom branding",
    ],
    cta: "Coming Soon",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Custom deployment for organizations with specific requirements.",
    badge: "Contact Us",
    features: [
      "Everything in Team",
      "Dedicated support",
      "SLA guarantees",
      "Custom integrations",
      "On-premise deployment",
      "Security audit",
      "Training sessions",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          MyInstaller is free and self-hosted. Team and Enterprise plans are on the roadmap.
        </p>
        <Badge variant="warning" className="mt-4">
          Team and Enterprise plans are placeholders — not yet available
        </Badge>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted ? "border-primary shadow-lg relative" : "relative"}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Recommended</Badge>
              </div>
            )}
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">
                {plan.badge}
              </Badge>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold">{plan.price}</div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={plan.cta === "Coming Soon"}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
