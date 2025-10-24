import { Card, CardContent } from "./ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  urgent?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  subtitle,
  urgent 
}: StatsCardProps) {
  return (
    <Card className={`shadow-lg border-border/50 ${urgent ? "border-red-300 bg-red-50" : "bg-white/80 backdrop-blur-sm"}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${
            urgent 
              ? "bg-red-100 text-red-600" 
              : "bg-gradient-to-br from-primary/10 to-pink-100 text-primary"
          }`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trendUp === true 
                ? "text-green-600" 
                : trendUp === false 
                  ? "text-red-600" 
                  : "text-muted-foreground"
            }`}>
              {trendUp === true && <TrendingUp className="w-4 h-4" />}
              {trendUp === false && <TrendingDown className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm mb-1">{title}</p>
          <p className={`${urgent ? "text-red-700" : "text-foreground"}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
