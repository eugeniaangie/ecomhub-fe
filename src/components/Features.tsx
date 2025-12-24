// 'use client'
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   ArrowRightIcon,
//   LayoutDashboardIcon,
//   LineChartIcon,
//   RefreshCwIcon,
//   TruckIcon,
// } from "lucide-react";
// import React from "react";

// export default function Features(): JSX.Element {
//   // Feature data for mapping
//   const features = [
//     {
//       icon: <RefreshCwIcon className="w-16 h-16" />,
//       title: "Real-Time Inventory Sync",
//       description:
//         "Never oversell again. Your inventory updates automatically across all stores.",
//     },
//     {
//       icon: <LayoutDashboardIcon className="w-16 h-16" />,
//       title: "Unified Order Dashboard",
//       description:
//         "View and manage orders from Tokopedia, Shopee, and others — in one place.",
//     },
//     {
//       icon: <LineChartIcon className="w-16 h-16" />,
//       title: "Smart Sales Analytics",
//       description:
//         "See which products sell best and which channels perform the strongest.",
//     },
//     {
//       icon: <TruckIcon className="w-16 h-16" />,
//       title: "Automated Fulfillment",
//       description:
//         "Connect to your logistics partners and ship orders faster, with less hassle.",
//     },
//   ];

//   return (
//     <section className="w-full py-16 bg-white">
//       <div className="container mx-auto px-4">
//         <h2 className="text-5xl font-bold text-center mb-16 font-['Outfit-Bold',Helvetica]">
//           Why Choose Us?
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {features.map((feature, index) => (
//             <Card
//               key={index}
//               className="h-[300px] shadow-[0px_2px_10px_#00000012] rounded-[5px] overflow-hidden"
//             >
//               <CardContent className="p-8 flex flex-col h-full">
//                 <div className="mb-6">{feature.icon}</div>
//                 <h3 className="font-['Roboto-Bold',Helvetica] font-bold text-black text-lg mb-4">
//                   {feature.title}
//                 </h3>
//                 <p className="font-['Roboto-Regular',Helvetica] font-normal text-[#808080] text-sm leading-[23.6px]">
//                   {feature.description}
//                 </p>
//                 <div className="mt-auto pt-4">
//                   <ArrowRightIcon className="w-8 h-8 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }
