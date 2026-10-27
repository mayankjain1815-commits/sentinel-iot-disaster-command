export function StatCard({
  label,
  value,
  suffix,
  detail,
  icon: Icon,
  tone = 'default',
  children,
  className = '',
}) {
  return (
    <article className={`stat-card stat-card--${tone} ${className}`}>
      <div className="stat-card__top">
        <span className="micro-label">{label}</span>
        {Icon ? (
          <span className="stat-card__icon">
            <Icon size={16} strokeWidth={1.7} />
          </span>
        ) : null}
      </div>
      <div className="stat-card__value-row">
        <span className="stat-card__value">{value}</span>
        {suffix ? <span className="stat-card__suffix">{suffix}</span> : null}
      </div>
      {detail ? <p className="stat-card__detail">{detail}</p> : null}
      {children ? <div className="stat-card__body">{children}</div> : null}
    </article>
  );
}
