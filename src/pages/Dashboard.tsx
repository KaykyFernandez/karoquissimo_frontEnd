import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Package, TrendingUp, Users } from 'lucide-react';
import { api } from '../services/api';

interface DashboardStats {
  totalClientes: number;
  totalProdutos: number;
  vendasHoje: number;
  faturamentoHoje: number;
  parcelasVencendoHoje: number;
  parcelasPendentes: number;
  valorPendenteTotal: number;
  produtosEstoqueBaixo: number;
}

interface ParcelaProxima {
  id: number;
  value: string;
  dueDate: string;
  sale: {
    documentNumber: string;
    client: {
      id: number;
      fullName: string;
    };
  };
}

interface ProdutoEstoqueBaixo {
  id: number;
  code: string;
  name: string;
  units: number;
  category: {
    name: string;
  };
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function SkeletonLine() {
  return <div className="h-8 w-full animate-pulse rounded bg-slate-100" />;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClassName: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <Icon size={24} className={iconClassName} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
  });

  const parcelasQuery = useQuery<ParcelaProxima[]>({
    queryKey: ['dashboard', 'parcelas-proximas'],
    queryFn: () => api.get('/dashboard/parcelas-proximas').then(r => r.data),
  });

  const estoqueQuery = useQuery<ProdutoEstoqueBaixo[]>({
    queryKey: ['dashboard', 'estoque-baixo'],
    queryFn: () => api.get('/dashboard/estoque-baixo').then(r => r.data),
  });

  return (
    <div className="space-y-6 bg-white text-slate-800">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumo operacional diário.</p>
      </div>

      {statsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Clientes"
            value={statsQuery.data?.totalClientes ?? 0}
            icon={Users}
            iconClassName="text-slate-600"
          />
          <StatCard
            title="Total Produtos"
            value={statsQuery.data?.totalProdutos ?? 0}
            icon={Package}
            iconClassName="text-slate-600"
          />
          <StatCard
            title="Faturamento Hoje"
            value={formatCurrency(statsQuery.data?.faturamentoHoje ?? 0)}
            icon={TrendingUp}
            iconClassName="text-emerald-600"
          />
          <StatCard
            title="Parcelas Vencendo Hoje"
            value={statsQuery.data?.parcelasVencendoHoje ?? 0}
            icon={CalendarDays}
            iconClassName={(statsQuery.data?.parcelasVencendoHoje ?? 0) > 0 ? 'text-red-600' : 'text-slate-600'}
          />
        </div>
      )}

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Parcelas nos próximos 7 dias</h2>
            <p className="text-sm text-slate-500">Próximos vencimentos pendentes.</p>
          </div>
          <Link to="/parcelas" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            Ver todas
          </Link>
        </div>

        {parcelasQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Nº Doc</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-800">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parcelasQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Nenhuma parcela vencendo nos próximos 7 dias
                    </td>
                  </tr>
                )}
                {parcelasQuery.data?.map(parcela => (
                  <tr key={parcela.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{parcela.sale.client.fullName}</td>
                    <td className="px-4 py-3 text-slate-500">{parcela.sale.documentNumber}</td>
                    <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(parcela.value)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(parcela.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Produtos com estoque baixo</h2>
            <p className="text-sm text-slate-500">Produtos com 3 unidades ou menos.</p>
          </div>
          <Link to="/produtos" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            Ver todos
          </Link>
        </div>

        {estoqueQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Código</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Categoria</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-800">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {estoqueQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Nenhum produto com estoque crítico
                    </td>
                  </tr>
                )}
                {estoqueQuery.data?.map(produto => (
                  <tr key={produto.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{produto.code}</td>
                    <td className="px-4 py-3 text-slate-800">{produto.name}</td>
                    <td className="px-4 py-3 text-slate-500">{produto.category.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{produto.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
