/**
 * Single stable import boundary for Freighter wallet state.
 *
 * All components and hooks that need wallet state MUST import from this
 * module. Do NOT import useFreighter or FreighterContextType directly
 * from "@/context/FreighterProvider".
 */
export { useFreighter } from "@/context/FreighterProvider";
export type { FreighterContextType } from "@/context/FreighterProvider";
