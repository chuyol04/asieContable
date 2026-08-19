const units = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
] as const;

const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"] as const;
const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"] as const;

function underThousand(value: number, apocopate = false): string {
  let text: string;
  if (value < 30) text = units[value];
  else if (value < 100) text = `${tens[Math.floor(value / 10)]}${value % 10 ? ` y ${units[value % 10]}` : ""}`;
  else if (value === 100) text = "cien";
  else text = `${hundreds[Math.floor(value / 100)]}${value % 100 ? ` ${underThousand(value % 100)}` : ""}`;

  if (!apocopate) return text;
  return text.replace(/veintiuno$/, "veintiún").replace(/ y uno$/, " y un").replace(/uno$/, "un");
}

function integerInWords(value: number): string {
  if (value === 0) return "cero";
  const groups: number[] = [];
  for (let remaining = value; remaining > 0; remaining = Math.floor(remaining / 1000)) groups.push(remaining % 1000);

  const parts: string[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (!group) continue;
    if (index === 0) parts.push(underThousand(group, true));
    else if (index === 1) parts.push(group === 1 ? "mil" : `${underThousand(group, true)} mil`);
    else if (index === 2) parts.push(group === 1 ? "un millón" : `${underThousand(group, true)} millones`);
    else if (index === 3) parts.push(group === 1 ? "mil millones" : `${underThousand(group, true)} mil millones`);
    else if (index === 4) parts.push(group === 1 ? "un billón" : `${underThousand(group, true)} billones`);
    else throw new RangeError("El total excede el rango admitido para convertirlo a letra.");
  }
  return parts.join(" ");
}

export function amountInWords(value: string): string {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new TypeError("El total debe ser un importe decimal normalizado.");
  const integer = Number(match[1]);
  if (!Number.isSafeInteger(integer)) throw new RangeError("El total excede el rango seguro para convertirlo a letra.");
  const cents = (match[2] ?? "").padEnd(2, "0");
  const words = integerInWords(integer);
  const currency = integer === 1 ? "peso" : "pesos";
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} ${currency} ${cents}/100 M.N.`;
}
