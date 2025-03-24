import { Card, CardContent } from "@/components/ui/card";
import { StarIcon } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  initial: string;
  text: string;
  rating: number;
}

export default function TestimonialCard({ name, initial, text, rating }: TestimonialCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl text-white">
            {initial}
          </div>
          <div className="ml-4">
            <h4 className="font-semibold">{name}</h4>
            <div className="flex text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon 
                  key={i} 
                  className="h-4 w-4" 
                  fill={i < rating ? "currentColor" : "none"}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
