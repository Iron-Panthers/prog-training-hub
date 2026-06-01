export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-spectral text-3xl md:text-4xl font-bold text-navy">{title}</h1>
        {subtitle && (
          <p className="font-body text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}