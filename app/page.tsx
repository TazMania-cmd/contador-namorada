"use client"

import { useState } from 'react'
import { Transaction } from '@/types/finance'
import { PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react'

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'outcome'>('outcome');

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. LIMPEZA: Remove o "R$", pontos e transforma a vírgula em nada para converter em número
    // Se 'amount' for "R$ 1.250,50", numericValue vira 1250.50
    const numericValue = Number(amount.replace(/\D/g, "")) / 100;

    // 2. VALIDAÇÃO: Se o resultado não for um número válido ou for zero, para aqui
    if (!title || isNaN(numericValue) || numericValue <= 0) {
      return alert("Por favor, insira um título e um valor válido.");
    }

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      amount: numericValue, // AQUI DEVE IR O NÚMERO PURO (ex: 1250.5)
      type,
      category: 'Geral',
      date: new Date().toLocaleDateString('pt-BR'),
    };

  setTransactions([newTransaction, ...transactions]);
  setTitle('');
  setAmount(''); // Limpa o input
};

  // --- NOVA FUNÇÃO DE EXCLUIR ---
  const handleDeleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
  };

  const totalIncomes = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOutcomes = transactions
    .filter(t => t.type === 'outcome')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalBalance = totalIncomes - totalOutcomes;

  const formatCurrency = (value: string) => {
  const onlyDigits = value.replace(/\D/g, ""); // Remove tudo que não é número
  const formattedValue = (Number(onlyDigits) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return formattedValue;
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-10 text-gray-800">
      <div className="max-w-4xl mx-auto">
        
        {/* CARDS DE RESUMO */}
        <header className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 font-medium">Capital Total</span>
              <Wallet className="text-blue-500" size={20} />
            </div>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-500 font-medium">
              <span>Entradas</span>
              <ArrowUpCircle className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold">R$ {totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-500 font-medium">
              <span>Saídas</span>
              <ArrowDownCircle className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold">R$ {totalOutcomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* FORMULÁRIO */}
          <section className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-10">
              <h2 className="text-lg font-semibold mb-4">Nova Transação</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Descrição"
                  className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="R$ 0,00"
                  className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={amount} 
                  // Aqui é onde você usa a função para o erro sumir:
                  onChange={(e) => setAmount(formatCurrency(e.target.value))} 
                />
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 p-3 rounded-lg border font-medium ${type === 'income' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                  >
                    Entrada
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('outcome')}
                    className={`flex-1 p-3 rounded-lg border font-medium ${type === 'outcome' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 text-gray-500'}`}
                  >
                    Saída
                  </button>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                  <PlusCircle size={20} /> Adicionar
                </button>
              </form>
            </div>
          </section>

          {/* LISTA COM BOTÃO DE EXCLUIR */}
          <section className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100 font-semibold">Histórico Recente</div>
              <div className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <p className="p-10 text-center text-gray-400">Nenhuma transação encontrada.</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 group">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div>
                          <p className="font-semibold text-gray-700">{t.title}</p>
                          <p className="text-xs text-gray-400">{t.date}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}