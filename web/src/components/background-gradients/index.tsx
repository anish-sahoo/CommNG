"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
    variant?: "mentor" | "mentee";
    className?: string;
}

export default function BackgroundGradient({
  variant,
  className,
}: BackgroundGradientProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {variant === "mentee" && ( <>
      {/* blues */}
      <div className="absolute right-[20px] top-[450px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="absolute left-[30px] top-[1300px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="absolute left-[30px] top-[2300px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      {/* yellows */}
      <div className="absolute left-0 top-[524px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute left-0 top-[824px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute -right-40 top-[924px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute right-[70px] top-[2080px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      </>)}


        {variant === "mentor" && ( <> 
        {/* blues */}
        {/* blues */}
      <div className="absolute right-[20px] top-[450px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="absolute left-[30px] top-[1300px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="absolute left-[30px] top-[2300px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />
      <div className="absolute left-[30px] top-[3500px] h-[420px] w-[420px] rounded-full bg-blue-200 opacity-70 blur-[120px]" />

      {/* yellows */}
      <div className="absolute left-0 top-[524px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute left-0 top-[824px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute -right-40 top-[924px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute right-[70px] top-[2080px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute left-[130px] top-[2800px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />
      <div className="absolute right-0 top-[3200px] h-[420px] w-[420px] rounded-full bg-accent opacity-20 blur-[120px]" />

      </>)}

    </div>
  );
}


