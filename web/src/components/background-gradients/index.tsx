"use client";

interface BackgroundGradientProps {
  variant?: "mentor" | "mentee";
  className?: string;
}

export default function BackgroundGradient({
  variant,
}: BackgroundGradientProps) {
  return (
    <div className="pointer-events-none overflow-visible">
      {variant === "mentor" && (
        <>
          {/* Blue circles */}
          <div className="absolute right-10 top-[10vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute left-10 top-[300vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute right-20 top-[100vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute left-20 top-[190vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute right-20 top-[390vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />

          {/* Yellow circles */}
          <div className="absolute left-0 top-[0vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-5 top-[340vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-30 top-[260vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-10 top-[150vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-30 top-[450vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
        </>
      )}

      {variant === "mentee" && (
        <>
          {/* Blue circles */}
          <div className="absolute right-10 top-[10vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute left-10 top-[300vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute right-20 top-[100vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />
          <div className="absolute left-20 top-[190vh] h-80 w-80 rounded-full bg-blue-200 opacity-70 blur-[120px]" />

          {/* Yellow circles */}
          <div className="absolute left-0 top-[0vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-5 top-[300vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-30 top-[260vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
          <div className="absolute right-10 top-[150vh] h-80 w-80 rounded-full bg-accent opacity-20 blur-[120px]" />
        </>
      )}
    </div>
  );
}
