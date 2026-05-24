import jsPDF from 'jspdf';
import { numeroParaExtenso } from './numeroParaExtenso';

export interface EmpresaPromissoria {
  tradeName: string;
  corporateName: string;
  cnpj: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ClientePromissoria {
  fullName: string;
  cpf: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ParcelaPromissoria {
  number: number;
  value: number;
  dueDate: string;
  status: string;
}

export interface VendaPromissoria {
  documentNumber: string;
  createdAt: string;
  totalValue: number;
  entryValue: number;
  remainingValue: number;
}

function formatarData(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function formatarDataLonga(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarMoedaCurta(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function gerarPromissoria(
  empresa: EmpresaPromissoria,
  cliente: ClientePromissoria,
  venda: VendaPromissoria,
  parcelas: ParcelaPromissoria[],
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Layout constants ──
  const STUB_X = 8;
  const STUB_W = 50;
  const DIVIDER_X = STUB_X + STUB_W + 2;
  const MAIN_X = DIVIDER_X + 4;
  const MAIN_W = 210 - MAIN_X - 8;
  const TOP = 12;
  const BOT = 285;

  // ── LEFT STUB: Resumo do Credor ──
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.5);
  doc.rect(STUB_X, TOP, STUB_W, BOT - TOP);

  // Dashed cut line
  doc.setLineWidth(0.6);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.line(DIVIDER_X + 1, TOP, DIVIDER_X + 1, BOT);
  doc.setLineDashPattern([], 0);

  // Stub title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('RESUMO DO CREDIÁRIO:', STUB_X + 2, TOP + 8);

  // Stub table header
  doc.setLineWidth(0.2);
  doc.line(STUB_X + 2, TOP + 11, STUB_X + STUB_W - 2, TOP + 11);
  doc.setFontSize(6.5);
  doc.text('Parcela', STUB_X + 2, TOP + 16);
  doc.text('Vencimento', STUB_X + 17, TOP + 16);
  doc.text('Valor R$', STUB_X + STUB_W - 2, TOP + 16, { align: 'right' });
  doc.line(STUB_X + 2, TOP + 18, STUB_X + STUB_W - 2, TOP + 18);

  // Entrada row
  let rowY = TOP + 24;
  if (venda.entryValue > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Entrada', STUB_X + 2, rowY);
    doc.text(formatarData(venda.createdAt), STUB_X + 17, rowY);
    doc.text(formatarMoedaCurta(venda.entryValue), STUB_X + STUB_W - 2, rowY, { align: 'right' });
    rowY += 7;
  }

  // Installment rows
  parcelas.forEach(p => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const isPago = p.status === 'PAID';
    if (isPago) doc.setTextColor(150, 150, 150);
    doc.text(String(p.number).padStart(2, '0'), STUB_X + 2, rowY);
    doc.text(formatarData(p.dueDate), STUB_X + 17, rowY);
    doc.text(formatarMoedaCurta(p.value), STUB_X + STUB_W - 2, rowY, { align: 'right' });
    if (isPago) doc.setTextColor(0, 0, 0);
    rowY += 7;
  });

  // Total line
  doc.setLineWidth(0.2);
  doc.line(STUB_X + 2, rowY + 1, STUB_X + STUB_W - 2, rowY + 1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const total = parcelas.reduce((s, p) => s + p.value, 0) + venda.entryValue;
  doc.text('Total:', STUB_X + 2, rowY + 7);
  doc.text(formatarMoedaCurta(total), STUB_X + STUB_W - 2, rowY + 7, { align: 'right' });

  // ── RIGHT MAIN: Promissória ──
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.5);
  doc.rect(MAIN_X, TOP, MAIN_W, BOT - TOP);

  // Header: República + nome da empresa
  doc.setLineWidth(0.2);
  doc.line(MAIN_X, TOP + 11, MAIN_X + MAIN_W, TOP + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('REPÚBLICA FEDERATIVA DO BRASIL', MAIN_X + 3, TOP + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(empresa.tradeName.toUpperCase(), MAIN_X + MAIN_W - 3, TOP + 7, { align: 'right' });

  // Doc info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Doc.: ${venda.documentNumber}`, MAIN_X + 3, TOP + 16);
  doc.text(`CNPJ: ${empresa.cnpj}`, MAIN_X + MAIN_W - 3, TOP + 16, { align: 'right' });
  doc.line(MAIN_X, TOP + 19, MAIN_X + MAIN_W, TOP + 19);

  // NOTA PROMISSÓRIA title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('NOTA PROMISSÓRIA', MAIN_X + MAIN_W / 2, TOP + 30, { align: 'center' });

  // R$ box
  doc.setLineWidth(0.4);
  doc.rect(MAIN_X + 3, TOP + 33, 65, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('R$:', MAIN_X + 5, TOP + 40);
  doc.setFontSize(12);
  doc.text(formatarMoeda(venda.remainingValue), MAIN_X + 14, TOP + 40);

  // Vencimento (first pending installment)
  const firstPending = parcelas.find(p => p.status !== 'PAID') ?? parcelas[0];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Vencimento: ${formatarDataLonga(firstPending.dueDate)}`,
    MAIN_X + MAIN_W - 3,
    TOP + 40,
    { align: 'right' },
  );

  // Legal text
  const extenso = numeroParaExtenso(venda.remainingValue);
  const extensoCap = extenso.charAt(0).toUpperCase() + extenso.slice(1);
  const texto =
    `Ao(s) ${formatarDataLonga(firstPending.dueDate)}, pagarei por esta única via de NOTA PROMISSÓRIA a ` +
    `${empresa.tradeName}, ou à sua ordem, a quantia de ${formatarMoeda(venda.remainingValue)} ` +
    `(${extensoCap}), em moeda corrente deste país, pagável em ` +
    `${empresa.city}/${empresa.state}, referente à compra ${venda.documentNumber} ` +
    `realizada em ${formatarData(venda.createdAt)}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const linhas = doc.splitTextToSize(texto, MAIN_W - 6);
  doc.text(linhas, MAIN_X + 3, TOP + 52);

  // EMITENTE section
  const yEmit = TOP + 105;
  doc.setLineWidth(0.2);
  doc.line(MAIN_X, yEmit, MAIN_X + MAIN_W, yEmit);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EMITENTE:', MAIN_X + 3, yEmit + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nome: ${cliente.fullName}`, MAIN_X + 3, yEmit + 15);
  doc.text(`CPF: ${cliente.cpf}`, MAIN_X + 3, yEmit + 23);
  doc.text(`Endereço: ${cliente.street}, ${cliente.number}`, MAIN_X + 3, yEmit + 31);
  doc.text(`${cliente.neighborhood} – ${cliente.city}/${cliente.state}`, MAIN_X + 3, yEmit + 39);

  // Assinatura
  const ySig = yEmit + 65;
  doc.setLineWidth(0.2);
  doc.line(MAIN_X, ySig - 8, MAIN_X + MAIN_W, ySig - 8);

  const sigW = 85;
  const sigX = MAIN_X + MAIN_W / 2 - sigW / 2;
  doc.setLineWidth(0.5);
  doc.line(sigX, ySig + 15, sigX + sigW, ySig + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Assinatura do Emitente', MAIN_X + MAIN_W / 2, ySig + 21, { align: 'center' });
  doc.text(cliente.fullName, MAIN_X + MAIN_W / 2, ySig + 28, { align: 'center' });
  doc.text(`CPF: ${cliente.cpf}`, MAIN_X + MAIN_W / 2, ySig + 34, { align: 'center' });

  // Emitido em
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(
    `Emitido em: ${formatarDataLonga(venda.createdAt)}`,
    MAIN_X + 3,
    ySig + 50,
  );

  // Rodapé
  doc.setFontSize(6.5);
  doc.setTextColor(160, 160, 160);
  doc.text('Documento gerado pelo sistema Estoque Karoquíssimo', MAIN_X + MAIN_W / 2, BOT - 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.save(`promissoria-${venda.documentNumber}.pdf`);
}
