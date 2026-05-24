import { api } from '../services/api';
import type { Produto } from '../services/produtos.service';

/**
 * Faz upload de foto para o backend, que repassa ao Supabase Storage
 * usando a service_role key (segura, nunca exposta no frontend).
 */
export async function uploadProdutoFoto(produtoId: number, file: File): Promise<Produto> {
  const formData = new FormData();
  formData.append('foto', file);

  const response = await api.patch<Produto>(`/produtos/${produtoId}/foto`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}
