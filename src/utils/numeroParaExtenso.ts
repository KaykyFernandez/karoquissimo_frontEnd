const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function menorQueMil(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const resto = n % 100;
  const d = Math.floor(resto / 10);
  const u = resto % 10;

  const partes: string[] = [];

  if (c > 0) partes.push(c === 1 && resto > 0 ? 'cento' : centenas[c]);
  if (resto >= 10 && resto <= 19) {
    partes.push(especiais[resto - 10]);
  } else {
    if (d > 0) partes.push(dezenas[d]);
    if (u > 0) partes.push(unidades[u]);
  }

  return partes.join(' e ');
}

export function numeroParaExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  const partes: string[] = [];

  const bilhoes = Math.floor(inteiro / 1_000_000_000);
  const milhoes = Math.floor((inteiro % 1_000_000_000) / 1_000_000);
  const milhares = Math.floor((inteiro % 1_000_000) / 1_000);
  const resto = inteiro % 1_000;

  if (bilhoes > 0) partes.push(`${menorQueMil(bilhoes)} ${bilhoes === 1 ? 'bilhão' : 'bilhões'}`);
  if (milhoes > 0) partes.push(`${menorQueMil(milhoes)} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  if (milhares > 0) partes.push(`${menorQueMil(milhares)} ${milhares === 1 ? 'mil' : 'mil'}`);
  if (resto > 0) partes.push(menorQueMil(resto));

  const reaisStr = partes.join(' e ');
  const reaisLabel = inteiro === 1 ? 'real' : 'reais';

  if (centavos === 0) return `${reaisStr} ${reaisLabel}`;

  const centavosStr = menorQueMil(centavos);
  const centavosLabel = centavos === 1 ? 'centavo' : 'centavos';

  if (inteiro === 0) return `${centavosStr} ${centavosLabel}`;

  return `${reaisStr} ${reaisLabel} e ${centavosStr} ${centavosLabel}`;
}
