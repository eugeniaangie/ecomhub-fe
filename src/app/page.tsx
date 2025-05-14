// import { Card, CardContent } from "@/components/ui/card";
import React from "react";
// import { Cta } from "./components/Cta";
// import { Features } from "./Features";
// import { Footer } from "./Footer";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
// import { Navbar } from "./Navbar";
// import { ProblemSolution } from "./ProblemSolution";

// export default function ElementLandingPageHome(): JSX.Element {
//   // Data for trusted businesses section
//   const trustedBusinesses = {
//     title: "Trusted by small businesses across Indonesia",
//     companies: [
//       { name: "Asset", imageSrc: "", imageAlt: "Asset" },
//       { name: "Cthfy", imageSrc: "", imageAlt: "Cthfy" },
//       { name: "Drgg", imageSrc: "", imageAlt: "Drgg removebg" },
//       { name: "Girofle", imageSrc: "", imageAlt: "Girofle removebg" },
//     ],
//   };

//   return (
//     <div className="bg-[#010231] flex flex-row justify-center w-full">
//       <div className="bg-[#010231] overflow-hidden w-full max-w-[1440px] relative">
//         {/* Background decorative elements */}
//         <div className="absolute w-full h-full top-0 left-0 z-0 overflow-hidden">
//           <div className="absolute w-[679px] h-[699px] top-0 left-0 bg-[#8e8edb80] rounded-[339.5px/349.5px] blur-[152px]" />
//           <div className="absolute w-[679px] h-[699px] top-[602px] right-0 bg-[#9ad6d6cc] rounded-[339.5px/349.5px] blur-[152px] opacity-80" />
//         </div>

//         {/* Main content sections */}
//         <div className="relative z-10 flex flex-col w-full">
//           <Navbar />
//           <Hero />
//           <ProblemSolution />
//           <Features />
//           <CallToAction />

//           {/* Trusted businesses section */}
//           <section className="w-full flex justify-center px-4 py-12">
//             <Card className="w-full max-w-[1067px] bg-[#f0effbcc] rounded-[30px]">
//               <CardContent className="p-10">
//                 <div className="flex flex-col md:flex-row items-center justify-between">
//                   <h3 className="font-['Roboto-Bold',Helvetica] font-bold text-black text-3xl tracking-[0] leading-[27.5px] mb-6 md:mb-0 text-center md:text-left">
//                     {trustedBusinesses.title}
//                   </h3>
//                   <div className="flex flex-wrap items-center justify-center gap-8">
//                     {trustedBusinesses.companies.map((company, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center justify-center"
//                       >
//                         <img
//                           src={company.imageSrc}
//                           alt={company.imageAlt}
//                           className="h-16 object-contain"
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </section>

//           <Footer />
//         </div>
//       </div>
//     </div>
//   );
// }

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
    </div>
    
  );
}