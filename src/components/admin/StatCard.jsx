import PropTypes from 'prop-types';
// A importação 'LucideIcon' era um tipo do TypeScript, então foi removida.
// Em JavaScript, apenas recebemos o componente 'icon'.

// Props são definidos abaixo usando PropTypes

export function StatCard({ title, value, description, icon: Icon }) {
  return (
    // AJUSTE: A classe 'border' foi REMOVIDA
    <div className="rounded-lg bg-panel-card p-6 text-panel-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {/* Adicionamos uma verificação para garantir que o Ícone exista antes de renderizar */}
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// Definindo os PropTypes para o componente StatCard
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  // 'elementType' é o tipo correto para um componente React (como um ícone)
  icon: PropTypes.elementType.isRequired, 
};
