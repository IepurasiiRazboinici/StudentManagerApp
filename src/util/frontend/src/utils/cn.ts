import clsx from 'clsx'
import type { ClassValue } from 'clsx'

/** Thin wrapper around clsx so call sites have a single class-name helper. */
export function cn(...values: ClassValue[]): string {
  return clsx(...values)
}
