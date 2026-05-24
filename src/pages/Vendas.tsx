import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { clientesService } from '../services/clientes.service';
import type { Cliente } from '../services/clientes.service';
import { produtosService } from '../services/produtos.service';
import type { Produto } from '../services/produtos.service';
import { vendasService } from '../services/vendas.service';
import { api } from '../services/api';
import { gerarPromissoria } from '../utils/gerarPromissoria';
import type { EmpresaPromissoria } from '../utils/gerarPromissoria';

type ViewMode = 'lista' | 'formulario' | 'detalhe';
type SaleStatus = 'PAID' | 'PENDING' | 'CANCELLED';
type InstallmentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

interface VendaListItem {
  id: number;
  documentNumber: string;
  totalValue: string;
  entryValue: string;
  remainingValue: string;
  status: SaleStatus;
  createdAt: string;
  client: { id: number; fullName: string };
}

interface SaleItemDetail {
  id: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product: Produto;
}

interface InstallmentDetail {
  id: number;
  number: number;
  value: string;
  dueDate: string;
  paidAt?: string;
  status: InstallmentStatus;
}

interface VendaDetail extends VendaListItem {
  observation?: string;
  user: { id: number; name: string };
  saleItems: SaleItemDetail[];
  installments: InstallmentDetail[];
  client: Cliente;
}

interface ProductLine {
  productId: number;
  quantity: number;
  unitPrice: number;
}

const statusLabels: Record<SaleStatus, string> = {
  PAID: 'Quitada',
  PENDING: 'Pendente',
  CANCELLED: 'Cancelada',
};

const statusClasses: Record<SaleStatus, string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
};

const installmentLabels: Record<InstallmentStatus, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  OVERDUE: 'Atrasado',
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

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateValue: string, months: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date;
}

function calculateInstallments(total: number, entryValue: number, count: number, firstDueDate: string) {
  const remaining = Math.max(total - entryValue, 0);
  if (!firstDueDate) return [];
  if (remaining <= 0) {
    return [{ number: 1, value: total, dueDate: addMonths(firstDueDate, 0) }];
  }

  const baseValue = Math.round((remaining / count) * 100) / 100;
  let allocated = 0;
  return Array.from({ length: count }, (_, index) => {
    const isLast = index === count - 1;
    const value = isLast ? Math.round((remaining - allocated) * 100) / 100 : baseValue;
    allocated += value;
    return {
      number: index + 1,
      value,
      dueDate: addMonths(firstDueDate, index),
    };
  });
}

export function Vendas() {
  const [view, setView] = useState<ViewMode>('lista');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [clienteId, setClienteId] = useState('');
  const [items, setItems] = useState<ProductLine[]>([{ productId: 0, quantity: 1, unitPrice: 0 }]);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [dataVencimento1, setDataVencimento1] = useState(todayInput());
  const [observacao, setObservacao] = useState('');
  const queryClient = useQueryClient();

  const vendasQuery = useQuery<VendaListItem[]>({
    queryKey: ['vendas'],
    queryFn: () => vendasService.list(),
  });

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesService.list(),
  });

  const produtosQuery = useQuery({
    queryKey: ['produtos'],
    queryFn: () => produtosService.list(),
  });

  const vendaDetailQuery = useQuery<VendaDetail>({
    queryKey: ['vendas', selectedSaleId],
    queryFn: () => vendasService.getOne(selectedSaleId as number),
    enabled: selectedSaleId !== null && view === 'detalhe',
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: unknown) => vendasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      resetForm();
      setView('lista');
    },
  });

  const productsById = useMemo(() => {
    const map = new Map<number, Produto>();
    produtosQuery.data?.forEach(product => map.set(product.id, product));
    return map;
  }, [produtosQuery.data]);

  const totalValue = useMemo(
    () => items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
    [items],
  );

  const installmentPreview = useMemo(
    () => calculateInstallments(totalValue, valorEntrada, Math.max(numeroParcelas, 1), dataVencimento1),
    [dataVencimento1, numeroParcelas, totalValue, valorEntrada],
  );

  const resetForm = () => {
    setClienteId('');
    setItems([{ productId: 0, quantity: 1, unitPrice: 0 }]);
    setValorEntrada(0);
    setNumeroParcelas(1);
    setDataVencimento1(todayInput());
    setObservacao('');
  };

  const updateItem = (index: number, patch: Partial<ProductLine>) => {
    setItems(current =>
      current.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    );
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = productsById.get(productId);
    updateItem(index, {
      productId,
      unitPrice: product ? Number(product.price) : 0,
    });
  };

  const addItem = () => {
    setItems(current => [...current, { productId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const openDetail = (id: number) => {
    setSelectedSaleId(id);
    setView('detalhe');
  };

  const submitSale = () => {
    const validItems = items.filter(item => item.productId > 0 && item.quantity > 0 && item.unitPrice > 0);
    if (!clienteId || validItems.length === 0 || !dataVencimento1) return;

    createSaleMutation.mutate({
      clienteId: Number(clienteId),
      itens: validItems.map(item => ({
        produtoId: item.productId,
        quantidade: item.quantity,
        valorUnitario: item.unitPrice,
      })),
      valorEntrada,
      numeroParcelas: Math.max(numeroParcelas, 1),
      dataVencimento1,
      observacao: observacao.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 bg-white text-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendas</h1>
          <p className="text-sm text-slate-500">Registro, consulta e detalhamento de vendas.</p>
        </div>
        {view === 'lista' ? (
          <button
            type="button"
            onClick={() => setView('formulario')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            Nova Venda
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setView('lista')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        )}
      </div>

      {view === 'lista' && (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Nº Doc</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Cliente</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-800">Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-800">Entrada</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-800">Restante</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-800">Data</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-800">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {vendasQuery.isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Carregando vendas...
                    </td>
                  </tr>
                )}
                {vendasQuery.isError && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                      Não foi possível carregar as vendas.
                    </td>
                  </tr>
                )}
                {vendasQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma venda registrada.
                    </td>
                  </tr>
                )}
                {vendasQuery.data?.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{sale.documentNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{sale.client.fullName}</td>
                    <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(sale.totalValue)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(sale.entryValue)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(sale.remainingValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[sale.status]}`}>
                        {statusLabels[sale.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(sale.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(sale.id)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 hover:border-amber-600 hover:text-amber-600"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'formulario' && (
        <div className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-800">Cliente</h2>
            <select
              value={clienteId}
              onChange={event => setClienteId(event.target.value)}
              className="mt-3 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
            >
              <option value="">Selecione um cliente</option>
              {clientesQuery.data?.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.fullName} - {cliente.cpf}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Produtos</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-800 hover:border-amber-600 hover:text-amber-600"
              >
                <Plus size={16} />
                Adicionar Produto
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_120px_150px_130px_44px]">
                  <select
                    value={item.productId}
                    onChange={event => handleProductChange(index, Number(event.target.value))}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  >
                    <option value={0}>Selecione o produto</option>
                    {produtosQuery.data?.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={event => updateItem(index, { quantity: Number(event.target.value) })}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  />
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={event => updateItem(index, { unitPrice: Number(event.target.value) })}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  />
                  <div className="flex h-10 items-center justify-end rounded-md bg-slate-50 px-3 text-sm font-semibold text-slate-800">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Remover produto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end text-lg font-bold text-slate-800">
              Total: {formatCurrency(totalValue)}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-800">Pagamento</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Valor de Entrada</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={valorEntrada}
                  onChange={event => setValorEntrada(Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Nº Parcelas</span>
                <input
                  type="number"
                  min={1}
                  value={numeroParcelas}
                  onChange={event => setNumeroParcelas(Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Data 1º Vencimento</span>
                <input
                  type="date"
                  value={dataVencimento1}
                  onChange={event => setDataVencimento1(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-1.5">
              <span className="text-sm font-medium text-slate-800">Observação</span>
              <textarea
                value={observacao}
                onChange={event => setObservacao(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              />
            </label>

            <div className="mt-4 rounded-md border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
                Preview das parcelas
              </div>
              <div className="divide-y divide-slate-200">
                {installmentPreview.map(installment => (
                  <div key={installment.number} className="grid grid-cols-3 px-4 py-2 text-sm">
                    <span className="text-slate-800">{installment.number}</span>
                    <span className="text-slate-500">{formatCurrency(installment.value)}</span>
                    <span className="text-slate-500">{formatDate(installment.dueDate.toISOString())}</span>
                  </div>
                ))}
              </div>
            </div>

            {createSaleMutation.isError && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Não foi possível registrar a venda.
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={submitSale}
                disabled={createSaleMutation.isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createSaleMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Registrar Venda
              </button>
            </div>
          </section>
        </div>
      )}

      {view === 'detalhe' && (
        <div className="space-y-5">
          {vendaDetailQuery.isLoading && (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Carregando venda...
            </div>
          )}

          {vendaDetailQuery.data && (
            <>
              <section className="rounded-md border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-lg font-semibold text-slate-800">{vendaDetailQuery.data.documentNumber}</h2>
                  <button
                    onClick={() => {
                      const venda = vendaDetailQuery.data!;
                      api.get<EmpresaPromissoria>('/empresa').then(res => {
                        gerarPromissoria(
                          res.data,
                          {
                            fullName: venda.client.fullName,
                            cpf: (venda.client as any).cpf ?? '',
                            street: (venda.client as any).street ?? '',
                            number: (venda.client as any).number ?? '',
                            neighborhood: (venda.client as any).neighborhood ?? '',
                            city: (venda.client as any).city ?? '',
                            state: (venda.client as any).state ?? '',
                          },
                          {
                            documentNumber: venda.documentNumber,
                            createdAt: venda.createdAt,
                            totalValue: Number(venda.totalValue),
                            entryValue: Number(venda.entryValue),
                            remainingValue: Number(venda.remainingValue),
                          },
                          venda.installments.map(p => ({
                            number: p.number,
                            value: Number(p.value),
                            dueDate: p.dueDate,
                            status: p.status,
                          })),
                        );
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <FileText size={15} />
                    Imprimir Promissória
                  </button>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div><span className="text-slate-500">Cliente: </span><span className="font-medium text-slate-800">{vendaDetailQuery.data.client.fullName}</span></div>
                  <div><span className="text-slate-500">Usuário: </span><span className="font-medium text-slate-800">{vendaDetailQuery.data.user.name}</span></div>
                  <div><span className="text-slate-500">Data: </span><span className="font-medium text-slate-800">{formatDate(vendaDetailQuery.data.createdAt)}</span></div>
                  <div><span className="text-slate-500">Total: </span><span className="font-medium text-slate-800">{formatCurrency(vendaDetailQuery.data.totalValue)}</span></div>
                  <div><span className="text-slate-500">Entrada: </span><span className="font-medium text-slate-800">{formatCurrency(vendaDetailQuery.data.entryValue)}</span></div>
                  <div><span className="text-slate-500">Restante: </span><span className="font-medium text-slate-800">{formatCurrency(vendaDetailQuery.data.remainingValue)}</span></div>
                </div>
                {vendaDetailQuery.data.observation && (
                  <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    {vendaDetailQuery.data.observation}
                  </p>
                )}
              </section>

              <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">Itens</div>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-800">Produto</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-800">Quantidade</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-800">Valor Unitário</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-800">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vendaDetailQuery.data.saleItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-800">{item.product.name}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">Parcelas</div>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-800">Número</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-800">Valor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-800">Vencimento</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-800">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-800">Pago Em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vendaDetailQuery.data.installments.map(installment => (
                      <tr key={installment.id}>
                        <td className="px-4 py-3 text-slate-800">{installment.number}</td>
                        <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(installment.value)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(installment.dueDate)}</td>
                        <td className="px-4 py-3 text-slate-500">{installmentLabels[installment.status]}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(installment.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
