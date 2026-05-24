import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { parcelasService } from '../services/parcelas.service';

type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

interface Parcela {
  id: number;
  number: number;
  value: string;
  dueDate: string;
  paidAt?: string;
  status: InstallmentStatus;
  sale: {
    id: number;
    documentNumber: string;
    installments?: Parcela[];
    client: {
      id: number;
      fullName: string;
    };
  };
}

const statusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
};

const statusClasses: Record<InstallmentStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  OVERDUE: 'border-red-200 bg-red-50 text-red-700',
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function isOverdue(parcela: Parcela) {
  if (parcela.status !== 'PENDING') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(parcela.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function Parcelas() {
  const [status, setStatus] = useState('');
  const [vencimentoAte, setVencimentoAte] = useState('');
  const queryClient = useQueryClient();

  const queryParams = useMemo(
    () => ({
      ...(status && { status }),
      ...(vencimentoAte && { vencimentoAte }),
    }),
    [status, vencimentoAte],
  );

  const parcelasQuery = useQuery<Parcela[]>({
    queryKey: ['parcelas', queryParams],
    queryFn: () => parcelasService.list(queryParams),
  });

  const pagarMutation = useMutation({
    mutationFn: (id: number) => parcelasService.pagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
    },
  });

  const handlePagar = (parcela: Parcela) => {
    if (window.confirm(`Confirmar recebimento de ${formatCurrency(parcela.value)}?`)) {
      pagarMutation.mutate(parcela.id);
    }
  };

  return (
    <div className="space-y-6 bg-white text-slate-800">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Parcelas</h1>
        <p className="text-sm text-slate-500">Acompanhamento financeiro e baixa de pagamentos.</p>
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-800">Status</span>
          <select
            value={status}
            onChange={event => setStatus(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="OVERDUE">Atrasado</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-800">Vencimento até</span>
          <input
            type="date"
            value={vencimentoAte}
            onChange={event => setVencimentoAte(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
          />
        </label>
      </div>

      {pagarMutation.isError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível registrar o pagamento.
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Nº Doc</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Parcela Nº</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Valor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Vencimento</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Pago Em</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {parcelasQuery.isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Carregando parcelas...
                  </td>
                </tr>
              )}

              {parcelasQuery.isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                    Não foi possível carregar as parcelas.
                  </td>
                </tr>
              )}

              {parcelasQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma parcela encontrada.
                  </td>
                </tr>
              )}

              {parcelasQuery.data?.map(parcela => {
                const overdue = isOverdue(parcela);
                const visualStatus = overdue ? 'OVERDUE' : parcela.status;
                const paid = parcela.status === 'PAID';

                return (
                  <tr
                    key={parcela.id}
                    className={`${overdue ? 'bg-red-50' : 'hover:bg-slate-50'} ${paid ? 'text-slate-400' : ''}`}
                  >
                    <td className={`px-4 py-3 font-medium ${paid ? 'text-slate-400' : 'text-slate-800'}`}>
                      {parcela.sale.documentNumber}
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {parcela.sale.client.fullName}
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {parcela.number}
                    </td>
                    <td className={`px-4 py-3 text-right ${paid ? 'text-slate-400' : 'text-slate-800'}`}>
                      {formatCurrency(parcela.value)}
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : overdue ? 'font-semibold text-red-700' : 'text-slate-500'}`}>
                      {formatDate(parcela.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[visualStatus]}`}>
                        {statusLabels[visualStatus]}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatDate(parcela.paidAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!paid && (
                        <button
                          type="button"
                          onClick={() => handlePagar(parcela)}
                          disabled={pagarMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {pagarMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Registrar Pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
