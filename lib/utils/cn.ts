// Re-export cn from shadcn-generated utils for use in our own code.
// shadcn components import directly from "@/lib/utils"; this re-export
// lets our code use "@/lib/utils/cn" without moving the source.
export { cn } from "@/lib/utils";
