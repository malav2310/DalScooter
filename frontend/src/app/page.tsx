import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bike,
  BikeIcon as Scooter,
  Waypoints,
  Smile,
  Meh,
  Frown,
} from "lucide-react";

// This data can be moved to a separate file or fetched from an API
const bikeTypes = [
  {
    name: "Gyroscooter",
    image: "/placeholder.svg?height=200&width=300",
    availability: "Available",
    tariff: "$25/hour",
    icon: <Scooter className="h-6 w-6" />,
    feedbackPolarity: "Positive",
  },
  {
    name: "eBikes",
    image: "/placeholder.svg?height=200&width=300",
    availability: "Limited",
    tariff: "$50/day",
    icon: <Bike className="h-6 w-6" />,
    feedbackPolarity: "Neutral",
  },
  {
    name: "Segway",
    image: "/placeholder.svg?height=200&width=300",
    availability: "Out of Stock",
    tariff: "$35/hour",
    icon: <Waypoints className="h-6 w-6" />,
    feedbackPolarity: "Negative",
  },
];

const getPolarityInfo = (polarity: string) => {
  switch (polarity) {
    case "Positive":
      return {
        icon: <Smile className="h-5 w-5 text-green-500" />,
        textClass: "text-green-600",
      };
    case "Neutral":
      return {
        icon: <Meh className="h-5 w-5 text-yellow-500" />,
        textClass: "text-yellow-600",
      };
    case "Negative":
      return {
        icon: <Frown className="h-5 w-5 text-red-500" />,
        textClass: "text-red-600",
      };
    default:
      return {
        icon: null,
        textClass: "text-gray-500",
      };
  }
};

export default function HomePage() {
  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Discover Your Next Ride
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
              Explore our range of gyroscooters, eBikes, and Segways. Check
              availability and tariffs below.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
          {bikeTypes.map((bike, index) => {
            const polarity = getPolarityInfo(bike.feedbackPolarity);

            return (
              <Card
                key={index}
                className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <Image
                  src={bike.image || "/placeholder.svg"}
                  width={400}
                  height={250}
                  alt={`${bike.name} image`}
                  className="w-full h-48 object-cover"
                />
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  {bike.icon}
                  <CardTitle className="text-2xl font-bold">
                    {bike.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <CardDescription className="text-lg">
                    Availability:{" "}
                    <span
                      className={`font-semibold ${
                        bike.availability === "Available"
                          ? "text-green-600"
                          : bike.availability === "Limited"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {bike.availability}
                    </span>
                  </CardDescription>
                  <CardDescription className="text-lg">
                    Tariff:{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {bike.tariff}
                    </span>
                  </CardDescription>
                  <CardDescription className="text-lg flex items-center gap-2">
                    {polarity.icon}
                    <span className={`font-semibold ${polarity.textClass}`}>
                      {bike.feedbackPolarity} Feedback
                    </span>
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={bike.availability === "Out of Stock"}
                  >
                    {bike.availability === "Out of Stock"
                      ? "Unavailable"
                      : "Book Now"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
