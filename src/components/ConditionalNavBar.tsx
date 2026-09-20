"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";

export default function ConditionalNavBar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <NavBar />;
}
