// 'use client'
// import { Card, CardContent } from "@/components/ui/card";
// import { BarChart3, Package, RefreshCw, Settings } from "lucide-react";
// import React from "react";

// export default function ProblemSolution(): JSX.Element {
//   const features = [
//     {
//       icon: <Settings className="h-5 w-5 mr-2" />,
//       text: "No more manual updates: All your products auto-sync",
//     },
//     {
//       icon: <BarChart3 className="h-5 w-5 mr-2" />,
//       text: "Unified sales dashboard: See everything in one place",
//     },
//     {
//       icon: <RefreshCw className="h-5 w-5 mr-2" />,
//       text: "Real-time stock sync: Never oversell again",
//     },
//     {
//       icon: <Package className="h-5 w-5 mr-2" />,
//       text: "Automated fulfillment: Faster and easier shipping",
//     },
//   ];

//   return (
//     <section className="w-full py-16 bg-gray-200">
//       <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
//         <div className="w-full md:w-1/2 flex justify-center">
//           <img
//             className="w-full max-w-md h-auto"
//             alt="Person configuring settings illustration"
//             src=""
//           />
//         </div>

//         <div className="w-full md:w-1/2 space-y-6">
//           <h2 className="text-3xl font-bold text-black">
//             Selling Online Is Complicated. We Make It Simple.
//           </h2>

//           <p className="text-lg text-black">
//             Packed with powerful features that simplify how you sell, manage,
//             and grow — all from one place.
//           </p>

//           <Card className="border-none bg-transparent shadow-none">
//             <CardContent className="p-0 space-y-4">
//               {features.map((feature, index) => (
//                 <div key={index} className="flex items-start">
//                   {feature.icon}
//                   <span className="text-lg font-medium">{feature.text}</span>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </section>
//   );
// }
