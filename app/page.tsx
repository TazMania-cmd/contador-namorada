"use client"

import { useState, useEffect } from 'react'
import { Transaction } from '@/types/finance'
import { PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Trash2, Calendar, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type WeekStatus = {
  id: number;
  label: string;
  received: boolean | null;
};

type ScheduledPayment = {
  id: string;
  title: string;
  amount: number;
  week_id: number;
};

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'outcome'>('outcome');

  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedAmount, setSchedAmount] = useState<string>('');
  const [schedWeek, setSchedWeek] = useState<string>('1');

  const [weeksStatus, setWeeksStatus] = useState<WeekStatus[]>([
    { id: 1, label: 'Semana 1 (Dias 1-7)', received: null },
    { id: 2, label: 'Semana 2 (Dias 8-14)', received: null },
    { id: 3, label: 'Semana 3 (Dias 15-21)', received: null },
    { id: 4, label: 'Semana 4 (Dias 22-fim)', received: null },
  ]);

  useEffect(() => {
    async function fetchData() {
      const { data: transData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      const { data: weeksData } = await supabase.from('week_status').select('*').order('id', { ascending: true });
      const { data: schedData } = await supabase.from('scheduled_payments').select('*');

      if (transData) setTransactions(transData);
      if (weeksData && weeksData.length > 0) setWeeksStatus(weeksData);
      if (schedData) setScheduledPayments(schedData);
      setIsLoaded(true);
    }
    fetchData();
  }, []);

  let carryOver = 0;
  const weeksWithLimit = weeksStatus.map(week => {
    const weekScheduled = scheduledPayments
      .filter(p => p.week_id === week.id)
      .reduce((acc, p) => acc + p.amount, 0);

    let currentLimit = 200 + carryOver;
    if (week.received === false) {
      carryOver += 200;
      currentLimit = 0;
    } else {
      carryOver = 0;
      currentLimit -= weekScheduled;
    }
    return { ...week, currentLimit, weekScheduled };
  });

  const handleWeekChange = async (id: number, value: boolean) => {
    setWeeksStatus(weeksStatus.map(w => w.id === id ? { ...w, received: value } : w));
    await supabase.from('week_status').update({ received: value }).eq('id', id);
  };

  const handleAddScheduled = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = Number(schedAmount.replace(/\D/g, "")) / 100;
    if (!schedTitle || isNaN(numericValue) || numericValue <= 0) {
      return alert("Por favor, insira um título e um valor válido para o agendamento.");
    }
    const newSched: ScheduledPayment = {
      id: Math.random().toString(36).substr(2, 9),
      title: schedTitle,
      amount: numericValue,
      week_id: Number(schedWeek)
    };
    
    const { error } = await supabase.from('scheduled_payments').insert([newSched]);
    if (!error) {
      setScheduledPayments([...scheduledPayments, newSched]);
      setSchedTitle('');
      setSchedAmount('');
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    setScheduledPayments(scheduledPayments.filter(p => p.id !== id));
    await supabase.from('scheduled_payments').delete().eq('id', id);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericValue = Number(amount.replace(/\D/g, "")) / 100;
    if (!title || isNaN(numericValue) || numericValue <= 0) {
      return alert("Por favor, insira um título e um valor válido.");
    }

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      amount: numericValue,
      type,
      category: 'Geral',
      date: new Date().toLocaleDateString('pt-BR'),
    };

    const { error } = await supabase.from('transactions').insert([newTransaction]);
    if (!error) {
      setTransactions([newTransaction, ...transactions]);
      setTitle('');
      setAmount('');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    await supabase.from('transactions').delete().eq('id', id);
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

        {/* CONTROLE SEMANAL */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Controle Semanal (Base R$ 200)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeksWithLimit.map(week => (
              <div key={week.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">{week.label}</h3>
                  <p className="text-sm text-gray-500 mb-3">Recebeu essa semana?</p>
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => handleWeekChange(week.id, true)}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium border transition-colors ${week.received === true ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      Sim
                    </button>
                    <button 
                      onClick={() => handleWeekChange(week.id, false)}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium border transition-colors ${week.received === false ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Limite Disponível</p>
                  <p className={`text-xl font-bold ${week.currentLimit > 0 ? 'text-blue-600' : week.currentLimit < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    R$ {week.currentLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {week.weekScheduled > 0 && (
                    <p className="text-xs text-orange-500 mt-1 font-medium">
                      Agendado: R$ {week.weekScheduled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROW 1: FORMULÁRIOS LADO A LADO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* FORMULÁRIO */}
          <section>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Nova Transação</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4 flex flex-col flex-1">
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
                <div className="mt-auto pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> Adicionar
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* FORMULÁRIO DE AGENDAMENTO */}
          <section>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-orange-500"/> Agendar Pagamento
              </h2>
              <form onSubmit={handleAddScheduled} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Descrição (ex: Conta)"
                  className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-orange-500"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="R$ 0,00"
                  className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  value={schedAmount} 
                  onChange={(e) => setSchedAmount(formatCurrency(e.target.value))} 
                />
                <select
                  className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  value={schedWeek}
                  onChange={(e) => setSchedWeek(e.target.value)}
                >
                  <option value="1">Semana 1</option>
                  <option value="2">Semana 2</option>
                  <option value="3">Semana 3</option>
                  <option value="4">Semana 4</option>
                </select>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> Agendar
                  </button>
                </div>
              </form>
              
              {/* Lista de agendamentos */}
              {scheduledPayments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex-1 overflow-y-auto max-h-[150px] pr-2">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Agendamentos Ativos</h3>
                  <div className="space-y-3">
                    {scheduledPayments.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <div>
                          <p className="font-medium text-orange-900 text-sm">{p.title}</p>
                          <p className="text-xs text-orange-600">Semana {p.week_id}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-orange-700">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <button type="button" onClick={() => handleDeleteScheduled(p.id)} className="text-orange-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ROW 2: HISTÓRICO RECENTE EMBAIXO */}
        <div className="w-full">
          <section>
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