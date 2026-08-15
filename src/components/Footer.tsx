import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.6' }}>
      <p style={{ maxWidth: '800px', margin: '0 auto' }}>
        Este sitio es una herramienta independiente de consulta informativa y sin fines oficiales. Los datos de precios son obtenidos de fuentes públicas del Mercado de Abasto Central de Mar del Plata. No existe vinculación comercial u oficial con dicha entidad.
      </p>
    </footer>
  );
};
