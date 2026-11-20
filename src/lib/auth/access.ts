const EMAILS_INTERNOS_AUTORIZADOS = new Set([
  "eduardocamposmachadoalv@gmail.com",
  "tarin@neosenses.com.br",
  "thamyflores@gmail.com",
]);

export function emailInternoAutorizado(email: string | null | undefined): boolean {
  return Boolean(email && EMAILS_INTERNOS_AUTORIZADOS.has(email.trim().toLowerCase()));
}
