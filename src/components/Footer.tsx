// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Separator } from "@/components/ui/separator";
// import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
// import React from "react";

// export default function Footer() {
//   // Social media links data
//   const socialLinks = [
//     { icon: <Instagram className="h-6 w-6" />, href: "#" },
//     { icon: <Linkedin className="h-6 w-6" />, href: "#" },
//     { icon: <Twitter className="h-6 w-6" />, href: "#" },
//     { icon: <Youtube className="h-6 w-6" />, href: "#" },
//     // Using a generic icon for TikTok since it's not in lucide-react
//     {
//       icon: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="24"
//           height="24"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           className="h-6 w-6"
//         >
//           <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
//         </svg>
//       ),
//       href: "#",
//     },
//   ];

//   // Navigation links data
//   const ecomHubLinks = [
//     { text: "About Us", href: "#" },
//     { text: "Pricing", href: "#" },
//     { text: "Contact Us", href: "#" },
//     { text: "Partners", href: "#" },
//   ];

//   const legalLinks = [
//     { text: "Privacy Policy", href: "#" },
//     { text: "Terms of Service", href: "#" },
//   ];

//   return (
//     <footer className="w-full bg-transparent py-12 text-white">
//       <div className="container mx-auto px-4">
//         <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
//           {/* Brand Section */}
//           <div className="flex flex-col space-y-4">
//             <h2 className="font-['Outfit-Bold',Helvetica] text-[32px] font-bold leading-[27.5px] tracking-[0]">
//               ecomHub
//             </h2>
//             <p className="font-['Roboto-Regular',Helvetica] text-sm leading-[21px]">
//               Empowering small businesses to grow online.
//             </p>
//             <div className="flex space-x-4 pt-2">
//               {socialLinks.map((link, index) => (
//                 <a
//                   key={index}
//                   href={link.href}
//                   className="text-white hover:text-gray-300 transition-colors"
//                 >
//                   {link.icon}
//                 </a>
//               ))}
//             </div>
//           </div>

//           {/* ecomHub Links */}
//           <div className="flex flex-col space-y-4">
//             <h3 className="font-['Outfit-SemiBold',Helvetica] text-base font-semibold leading-normal">
//               ecomHub
//             </h3>
//             <nav className="flex flex-col space-y-1">
//               {ecomHubLinks.map((link, index) => (
//                 <a
//                   key={index}
//                   href={link.href}
//                   className="font-['Roboto-Regular',Helvetica] text-base leading-[31px] hover:underline"
//                 >
//                   {link.text}
//                 </a>
//               ))}
//             </nav>
//           </div>

//           {/* Legal Links */}
//           <div className="flex flex-col space-y-4">
//             <h3 className="font-['Outfit-SemiBold',Helvetica] text-base font-semibold leading-normal">
//               legal
//             </h3>
//             <nav className="flex flex-col space-y-1">
//               {legalLinks.map((link, index) => (
//                 <a
//                   key={index}
//                   href={link.href}
//                   className="font-['Roboto-Regular',Helvetica] text-base leading-[31px] hover:underline"
//                 >
//                   {link.text}
//                 </a>
//               ))}
//             </nav>
//           </div>

//           {/* Newsletter Section */}
//           <div className="flex flex-col space-y-4">
//             <h3 className="font-['Outfit-SemiBold',Helvetica] text-[22px] font-semibold leading-normal">
//               join our newsletter
//             </h3>
//             <div className="flex h-10 w-full max-w-[330px] overflow-hidden rounded-[70px] bg-[#222354]">
//               <Input
//                 type="email"
//                 placeholder="Email Address"
//                 className="border-0 bg-transparent px-4 text-white placeholder:opacity-70 focus-visible:ring-0 focus-visible:ring-offset-0"
//               />
//               <Button className="h-10 rounded-[83px] bg-[#8e8edb] px-5 font-['Outfit-SemiBold',Helvetica] text-sm font-semibold tracking-[1.40px] hover:bg-[#7a7ac7]">
//                 SUBMIT
//               </Button>
//             </div>
//           </div>
//         </div>

//         <Separator className="my-6 bg-gray-700" />

//         {/* Copyright */}
//         <div className="text-center">
//           <p className="font-['Roboto-Regular',Helvetica] text-xs leading-[21px]">
//             © Copyright 2025 ecomHub. All rights reserved.
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }
