import { cn } from "../utils";

export function UniLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center rounded-[22%] bg-gradient-to-tr from-[#8b5cf6] via-[#3b82f6] to-[#10b981] shadow-lg overflow-hidden flex-shrink-0", className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white p-[15%]">
        <path d="M50 10C27.9086 10 10 27.908 10 50C10 59.8824 13.5855 68.932 19.5398 75.986L15 90L29.8973 85.8208C35.9189 88.5446 42.756 90 50 90C72.0914 90 90 72.092 90 50C90 27.908 72.0914 10 50 10Z" fill="currentColor"/>
        <path d="M30 50A6 6 0 1 1 30 49.99H30.01M50 50A6 6 0 1 1 50 49.99H50.01M70 50A6 6 0 1 1 70 49.99H70.01" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
