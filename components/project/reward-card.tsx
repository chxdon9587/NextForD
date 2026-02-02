import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface RewardCardProps {
  id: string;
  title: string;
  description: string;
  amount?: number;
  pledgeAmount?: number;
  estimatedDelivery?: Date;
  estimated_delivery?: string;
  backerLimit?: number;
  quantity_total?: number;
  backersCount?: number;
  quantity_claimed?: number;
  shippingType?: string;
  shipping_required?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export function RewardCard({
  title,
  description,
  amount,
  pledgeAmount,
  estimatedDelivery,
  estimated_delivery,
  backerLimit,
  quantity_total,
  backersCount,
  quantity_claimed,
  shippingType,
  shipping_required,
  onSelect,
  isSelected,
  disabled,
}: RewardCardProps) {
  const actualAmount = amount || pledgeAmount || 0;
  const actualBackerLimit = quantity_total || backerLimit;
  const actualBackersCount = quantity_claimed || backersCount || 0;
  const actualDelivery = estimatedDelivery || (estimated_delivery ? new Date(estimated_delivery) : undefined);
  const actualShipping = shipping_required === false ? 'digital' : (shippingType || 'worldwide');
  
  const isSoldOut = actualBackerLimit ? actualBackersCount >= actualBackerLimit : false;
  const isDisabled = disabled || isSoldOut;
  const availableSpots = actualBackerLimit ? actualBackerLimit - actualBackersCount : null;

  return (
    <Card
      className={`transition-all ${
        isSelected
          ? "ring-2 ring-primary-600 border-primary-600"
          : "hover:border-primary-300"
      } ${isDisabled ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
          <div className="text-2xl font-bold text-primary-600 mb-1">
            ${actualAmount}
          </div>
            <h4 className="font-semibold text-lg">{title}</h4>
          </div>
          {isSoldOut && (
            <Badge variant="destructive">Sold Out</Badge>
          )}
          {!isSoldOut && availableSpots !== null && availableSpots <= 10 && (
            <Badge variant="warning">{availableSpots} left</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {description}
        </p>

        <div className="space-y-2 pt-2 border-t">
          {actualDelivery && (
            <div className="flex items-center gap-2 text-sm">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-muted-foreground">
                Estimated delivery:{" "}
                <span className="text-foreground font-medium">
                  {actualDelivery.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          )}

          {actualShipping && (
            <div className="flex items-center gap-2 text-sm">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <span className="text-muted-foreground">
                Shipping:{" "}
                <span className="text-foreground font-medium capitalize">
                  {actualShipping}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{actualBackersCount}</span>{" "}
              {actualBackersCount === 1 ? "backer" : "backers"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={onSelect}
          disabled={isDisabled}
          variant={isSelected ? "default" : "outline"}
        >
          {isSoldOut
            ? "Sold Out"
            : isSelected
            ? "Selected"
            : "Select Reward"}
        </Button>
      </CardFooter>
    </Card>
  );
}
