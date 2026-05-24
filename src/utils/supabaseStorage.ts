import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'produtos';

/**
 * Faz upload de uma imagem para o Supabase Storage.
 * Retorna a URL pública da imagem.
 */
export async function uploadProdutoFoto(file: File, produtoCode: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${produtoCode}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Erro ao fazer upload: ${error.message}`);

  // Constrói a URL pública manualmente para garantir o caminho correto com /public/
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`;
}

/**
 * Remove uma foto do Supabase Storage pela URL pública.
 */
export async function deleteProdutoFoto(photoUrl: string): Promise<void> {
  const fileName = photoUrl.split('/').pop();
  if (!fileName) return;
  await supabase.storage.from(BUCKET).remove([fileName]);
}
