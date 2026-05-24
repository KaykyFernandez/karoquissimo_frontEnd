import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Edit2, ImagePlus, Loader2, PackagePlus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { z } from 'zod';
import { categoriasService, produtosService } from '../services/produtos.service';
import type { Categoria, Produto } from '../services/produtos.service';
import { uploadProdutoFoto } from '../utils/supabaseStorage';

const produtoSchema = z.object({
  code: z.string().min(1, 'Informe o código').max(50),
  name: z.string().min(2, 'Informe pelo menos 2 caracteres').max(150),
  categoryId: z.coerce.number().int().min(1, 'Selecione uma categoria'),
  color: z.string().min(1, 'Informe a cor'),
  size: z.string().min(1, 'Informe o tamanho'),
  price: z.coerce.number().min(0, 'Informe um preço válido'),
  units: z.coerce.number().int().min(0, 'Informe um estoque válido'),
  supplier: z.string().min(1, 'Informe o fornecedor'),
  expirationDate: z.string().optional(),
});

const estoqueSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().min(1, 'Informe uma quantidade maior que zero'),
  reason: z.string().min(3, 'Informe pelo menos 3 caracteres').max(200),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;
type EstoqueFormData = z.infer<typeof estoqueSchema>;

const emptyProdutoForm: ProdutoFormData = {
  code: '',
  name: '',
  categoryId: 0,
  color: '',
  size: '',
  price: 0,
  units: 0,
  supplier: '',
  expirationDate: '',
};

const emptyEstoqueForm: EstoqueFormData = {
  type: 'IN',
  quantity: 1,
  reason: '',
};

const movementLabels: Record<EstoqueFormData['type'], string> = {
  IN: 'Entrada',
  OUT: 'Saída',
  ADJUSTMENT: 'Ajuste',
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function toProdutoForm(produto: Produto): ProdutoFormData {
  return {
    code: produto.code,
    name: produto.name,
    categoryId: produto.categoryId,
    color: produto.color,
    size: produto.size,
    price: Number(produto.price),
    units: produto.units,
    supplier: produto.supplier,
    expirationDate: toDateInput(produto.expirationDate),
  };
}

function toProdutoPayload(data: ProdutoFormData, photoUrl?: string | null) {
  return {
    code: data.code.trim(),
    name: data.name.trim(),
    categoryId: data.categoryId,
    color: data.color.trim(),
    size: data.size.trim(),
    price: data.price,
    units: data.units,
    supplier: data.supplier.trim(),
    expirationDate: data.expirationDate || undefined,
    ...(photoUrl !== undefined ? { photoUrl } : {}),
  };
}

export function Produtos() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [stockProduto, setStockProduto] = useState<Produto | null>(null);

  // foto
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const produtosQuery = useQuery({
    queryKey: ['produtos', search, categoryFilter],
    queryFn: () => produtosService.list(search, categoryFilter),
  });

  const categoriasQuery = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasService.list,
  });

  const produtoForm = useForm<ProdutoFormData, unknown, ProdutoFormData>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: emptyProdutoForm,
  });

  const estoqueForm = useForm<EstoqueFormData, unknown, EstoqueFormData>({
    resolver: zodResolver(estoqueSchema) as any,
    defaultValues: emptyEstoqueForm,
  });

  const createMutation = useMutation({
    mutationFn: (data: ReturnType<typeof toProdutoPayload>) => produtosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      closeProductModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReturnType<typeof toProdutoPayload> }) =>
      produtosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      closeProductModal();
    },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { type: string; quantity: number; reason: string } }) =>
      produtosService.ajustarEstoque(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      closeStockModal();
    },
  });

  const categories = useMemo<Categoria[]>(() => categoriasQuery.data ?? [], [categoriasQuery.data]);

  useEffect(() => {
    if (editingProduto) {
      produtoForm.reset(toProdutoForm(editingProduto));
      setPhotoPreview(editingProduto.photoUrl ?? null);
    } else {
      produtoForm.reset(emptyProdutoForm);
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [editingProduto, produtoForm]);

  const openCreateModal = () => {
    setEditingProduto(null);
    setProductModalOpen(true);
  };

  const openEditModal = (produto: Produto) => {
    setEditingProduto(produto);
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    setProductModalOpen(false);
    setEditingProduto(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    produtoForm.reset(emptyProdutoForm);
  };

  const openStockModal = (produto: Produto) => {
    setStockProduto(produto);
    estoqueForm.reset(emptyEstoqueForm);
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setStockProduto(null);
    estoqueForm.reset(emptyEstoqueForm);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProductSubmit = async (data: ProdutoFormData) => {
    let photoUrl: string | null | undefined = undefined;

    // Se selecionou novo arquivo, faz upload
    if (photoFile) {
      try {
        setUploadingPhoto(true);
        photoUrl = await uploadProdutoFoto(photoFile, data.code);
      } catch {
        alert('Erro ao fazer upload da foto. Verifique sua conexão e tente novamente.');
        setUploadingPhoto(false);
        return;
      } finally {
        setUploadingPhoto(false);
      }
    } else if (photoPreview === null && editingProduto?.photoUrl) {
      // Foto removida no edit
      photoUrl = null;
    } else if (editingProduto?.photoUrl) {
      // Mantém a foto atual
      photoUrl = editingProduto.photoUrl;
    }

    const payload = toProdutoPayload(data, photoUrl);

    if (editingProduto) {
      updateMutation.mutate({ id: editingProduto.id, data: payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const handleStockSubmit = (data: EstoqueFormData) => {
    if (!stockProduto) return;
    stockMutation.mutate({
      id: stockProduto.id,
      data: {
        type: data.type,
        quantity: data.type === 'OUT' ? -Math.abs(data.quantity) : Math.abs(data.quantity),
        reason: data.reason.trim(),
      },
    });
  };

  const productFields: Array<{
    name: keyof ProdutoFormData;
    label: string;
    type?: string;
    className?: string;
  }> = [
    { name: 'code', label: 'Código' },
    { name: 'name', label: 'Nome', className: 'md:col-span-2' },
    { name: 'color', label: 'Cor' },
    { name: 'size', label: 'Tamanho' },
    { name: 'price', label: 'Preço', type: 'number' },
    { name: 'units', label: 'Unidades', type: 'number' },
    { name: 'supplier', label: 'Fornecedor', className: 'md:col-span-2' },
    { name: 'expirationDate', label: 'Validade', type: 'date' },
  ];

  const isSaving = uploadingPhoto || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 bg-white text-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-sm text-slate-500">Catálogo, preços e movimentações de estoque.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_260px]">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <Search size={18} className="text-slate-500" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-8 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
            placeholder="Buscar por nome"
          />
        </div>
        <select
          value={categoryFilter ?? ''}
          onChange={event => setCategoryFilter(event.target.value ? Number(event.target.value) : undefined)}
          className="h-12 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
        >
          <option value="">Todas as categorias</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Foto</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Código</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Categoria</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Cor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Tamanho</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Estoque</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Preço</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {produtosQuery.isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">Carregando produtos...</td>
                </tr>
              )}
              {produtosQuery.isError && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-red-600">Não foi possível carregar os produtos.</td>
                </tr>
              )}
              {produtosQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">Nenhum produto encontrado.</td>
                </tr>
              )}
              {produtosQuery.data?.map(produto => (
                <tr key={produto.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {produto.photoUrl ? (
                      <img
                        src={produto.photoUrl}
                        alt={produto.name}
                        className="h-10 w-10 rounded-md object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center">
                        <ImagePlus size={16} className="text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{produto.code}</td>
                  <td className="px-4 py-3 text-slate-800">{produto.name}</td>
                  <td className="px-4 py-3 text-slate-500">{produto.category.name}</td>
                  <td className="px-4 py-3 text-slate-500">{produto.color}</td>
                  <td className="px-4 py-3 text-slate-500">{produto.size}</td>
                  <td className={`px-4 py-3 text-right ${produto.units <= 3 ? 'font-semibold text-red-600' : 'text-slate-800'}`}>
                    {produto.units}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(produto.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openStockModal(produto)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-amber-600 hover:text-amber-600"
                        title="Ajustar estoque"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(produto)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-amber-600 hover:text-amber-600"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Produto */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingProduto ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <p className="text-sm text-slate-500">Preencha os dados do produto.</p>
              </div>
              <button
                type="button"
                onClick={closeProductModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-800"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={produtoForm.handleSubmit(handleProductSubmit)} className="space-y-5 px-6 py-5">
              {/* Campo de foto */}
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Foto do Produto <span className="text-slate-400 font-normal">(opcional)</span></span>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-md object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                        title="Remover foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-amber-500 hover:text-amber-500"
                    >
                      <ImagePlus size={24} />
                      <span className="mt-1 text-xs">Adicionar</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Formatos aceitos: JPG, PNG, WEBP</p>
                    <p>Tamanho máximo: 5MB</p>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-amber-600 hover:underline"
                      >
                        Trocar foto
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-800">Categoria</span>
                  <select
                    {...produtoForm.register('categoryId')}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  >
                    <option value={0}>Selecione</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {produtoForm.formState.errors.categoryId && (
                    <span className="block text-xs text-red-600">{produtoForm.formState.errors.categoryId.message}</span>
                  )}
                </label>

                {productFields.map(field => (
                  <label key={field.name} className={`space-y-1.5 ${field.className ?? ''}`}>
                    <span className="text-sm font-medium text-slate-800">{field.label}</span>
                    <input
                      type={field.type ?? 'text'}
                      step={field.name === 'price' ? '0.01' : undefined}
                      {...produtoForm.register(field.name)}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                    />
                    {produtoForm.formState.errors[field.name] && (
                      <span className="block text-xs text-red-600">{produtoForm.formState.errors[field.name]?.message}</span>
                    )}
                  </label>
                ))}
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Não foi possível salvar o produto.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {uploadingPhoto ? 'Enviando foto...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Estoque */}
      {stockModalOpen && stockProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Ajuste de Estoque</h2>
                <p className="text-sm text-slate-500">{stockProduto.code} - {stockProduto.name}</p>
              </div>
              <button
                type="button"
                onClick={closeStockModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-800"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={estoqueForm.handleSubmit(handleStockSubmit)} className="space-y-4 px-6 py-5">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Tipo</span>
                <select
                  {...estoqueForm.register('type')}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                >
                  {Object.entries(movementLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Quantidade</span>
                <input
                  type="number"
                  min={1}
                  {...estoqueForm.register('quantity')}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
                {estoqueForm.formState.errors.quantity && (
                  <span className="block text-xs text-red-600">{estoqueForm.formState.errors.quantity.message}</span>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-800">Motivo</span>
                <textarea
                  rows={3}
                  {...estoqueForm.register('reason')}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
                {estoqueForm.formState.errors.reason && (
                  <span className="block text-xs text-red-600">{estoqueForm.formState.errors.reason.message}</span>
                )}
              </label>

              {stockMutation.isError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Não foi possível ajustar o estoque.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={stockMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {stockMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
