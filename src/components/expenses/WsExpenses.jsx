import FinanceLedger from "../finance/FinanceLedger";

/**
 * Expenses page. Redesigned to use the shared FinanceLedger (type="expense"),
 * which groups categories by business unit, supports adding/editing/deleting
 * categories, the "paid to (employee)" payee for fuel/reimbursements, and the
 * correct /finance endpoints. Same component powers the Finance Stats →
 * Expenses tab.
 */
export default function ExpenseCategoriesSystem() {
  return <FinanceLedger type="expense" />;
}
