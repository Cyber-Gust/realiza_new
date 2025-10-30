export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-panel-card px-6 py-4"> {/* <-- AJUSTE: border-t */}
      <p className="text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Realiza Imóveis. Todos os direitos reservados.
      </p>
    </footer>
  );
}