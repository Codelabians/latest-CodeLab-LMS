import FinanceLedger from "../finance/FinanceLedger";

/**
 * Income page. Redesigned to match the Finance Stats / dashboard look.
 * All income category + transaction logic now lives in the shared
 * FinanceLedger component (type="income"), which keeps the same
 * /admin/finance endpoints, the Courses Military/Civilian tabs, and
 * the batch filter.
 */
export default function IncomeCategoriesSystem() {
  return <FinanceLedger type="income" />;
}
