import { type ClassValue, clsx } from "clsx"
import { twMerge } from "twr-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
