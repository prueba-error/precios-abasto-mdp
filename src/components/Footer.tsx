import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.6' }}>
      <p style={{ maxWidth: '800px', margin: '0 auto 8px auto' }}>
        Este sitio es una herramienta independiente de consulta informativa y sin fines oficiales. Los datos de precios son obtenidos de fuentes públicas del <a href="https://abastocentralmdp.com.ar/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Mercado de Abasto Central de Mar del Plata</a>. No existe vinculación comercial u oficial con dicha entidad.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        Desarrollado por <a href="https://github.com/prueba-error" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>github.com/prueba-error</a>
      </p>
    </footer>
  );
};
