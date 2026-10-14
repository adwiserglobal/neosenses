/**
 * Slug que pode entrar num filtro `.or()` do PostgREST.
 *
 * O texto vai montado dentro da gramática do filtro (`slug->>pt.eq.${slug},...`).
 * Vírgula, parêntese ou ponto vindos da URL (`?destino=`, `/blog/[slug]`)
 * quebram a consulta ou acrescentam condições. O RLS e os `.eq` seguintes
 * impedem vazamento de dado, mas a página responderia erro ou vazia para
 * qualquer endereço malformado. Slug legítimo só tem letras, números e hífen.
 */
export function slugSeguro(valor: string | null | undefined): string | null {
  if (!valor) return null;
  return /^[a-z0-9][a-z0-9_-]{0,119}$/i.test(valor) ? valor : null;
}
