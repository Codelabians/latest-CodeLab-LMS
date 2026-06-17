import { BRAND_RED } from "../dashboardConstants";

/**
 * Color palette used by HorizontalBarList. Kept in its own .js module
 * (not the component file) so React Fast Refresh stays happy — a file
 * that exports both constants and components confuses HMR.
 */
export const BAR_TONE = {
  brand: BRAND_RED,
  green: "#15803D",
  blue:  "#1D4ED8",
  amber: "#A16207",
  slate: "#475569",
};
