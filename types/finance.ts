export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'outcome';
  category: string;
  date: string;
}