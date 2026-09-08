/// Slugify simple, sin dependencia externa: minusculas, sin acentos, espacios
/// y caracteres no alfanumericos -> guion, sin guiones repetidos ni en los
/// extremos. Equivalente al slugify de Django (django.utils.text.slugify)
/// que ya usa el panel admin -- mismo criterio en los dos lados.
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // U+0300-U+036F: rango Unicode de marcas diacriticas combinantes (lo
    // que separa NFD de una vocal con tilde) -- las saca, deja la vocal sola.
    .replace(new RegExp('[̀-ͯ]', 'g'), '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
