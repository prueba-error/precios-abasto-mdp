import { Category, Product, PriceRecord } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Frutas' },
  { id: 2, name: 'Verduras' },
  { id: 3, name: 'Hortalizas' },
  { id: 4, name: 'Otros' }
];

export const MOCK_PRODUCTS: Product[] = [
  // 1. Frutas (category_id: 1)
  { id: 101, original_id: '198', name: 'MANDARINA OKITSU', category_id: 1 },
  { id: 102, original_id: '27', name: 'MANGO', category_id: 1 },
  { id: 103, original_id: '29', name: 'MANZANA DELICIOSA', category_id: 1 },
  { id: 104, original_id: '12', name: 'BANANA ECUADOR', category_id: 1 },
  { id: 105, original_id: '15', name: 'LIMON CLASICO', category_id: 1 },
  { id: 106, original_id: '18', name: 'NARANJA OMBILGO', category_id: 1 },
  { id: 107, original_id: '35', name: 'FRUTILLA MAR DEL PLATA', category_id: 1 },
  { id: 108, original_id: '42', name: 'PERA PACKHAM', category_id: 1 },

  // 2. Verduras (category_id: 2)
  { id: 201, original_id: '57', name: 'ACELGA DE ZONA', category_id: 2 },
  { id: 202, original_id: '65', name: 'LECHUGA CAPUCHINA', category_id: 2 },
  { id: 203, original_id: '67', name: 'LECHUGA CRIOLLA', category_id: 2 },
  { id: 204, original_id: '71', name: 'ESPINACA FRESCA', category_id: 2 },
  { id: 205, original_id: '75', name: 'RUCULA', category_id: 2 },
  { id: 206, original_id: '78', name: 'ACHICORIA DE HOJA', category_id: 2 },

  // 3. Hortalizas (category_id: 3)
  { id: 301, original_id: '102', name: 'TOMATE REDONDO', category_id: 3 },
  { id: 302, original_id: '104', name: 'TOMATE PERITA', category_id: 3 },
  { id: 303, original_id: '110', name: 'ZAPALLITO VERDE', category_id: 3 },
  { id: 304, original_id: '115', name: 'BERENJENA NEGRA', category_id: 3 },
  { id: 305, original_id: '120', name: 'ZANAHORIA SELECCIONADA', category_id: 3 },
  { id: 306, original_id: '125', name: 'PIMIENTO MORRON ROJO', category_id: 3 },
  { id: 307, original_id: '130', name: 'PAPA NEGRA', category_id: 3 },
  { id: 308, original_id: '135', name: 'CEBOLLA COMUN', category_id: 3 },

  // 4. Otros (category_id: 4)
  { id: 401, original_id: '201', name: 'HONGO CHAMPIÑON', category_id: 4 },
  { id: 402, original_id: '205', name: 'AJO CASTAÑO', category_id: 4 }
];

const dates = [
  '2026-06-15',
  '2026-06-22',
  '2026-06-29',
  '2026-07-06',
  '2026-07-13',
  '2026-07-20',
  '2026-07-27',
  '2026-08-03',
  '2026-08-10',
  '2026-08-17'
];

interface ProductConfig {
  id: number;
  origin: string;
  presentation: string;
  quantity: string;
  basePrice: number;
  trendFactor: number[]; // 10 multipliers for 10 dates
}

const productConfigs: ProductConfig[] = [
  // Frutas
  { id: 101, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity: '18 KG.', basePrice: 9500, trendFactor: [1.0, 1.05, 1.10, 1.15, 1.22, 1.28, 1.35, 1.42, 1.48, 1.55] }, // Subiendo constante
  { id: 102, origin: 'SALTA', presentation: 'CAJON', quantity: '20 KG.', basePrice: 18000, trendFactor: [1.2, 1.18, 1.15, 1.10, 1.05, 1.02, 1.0, 0.98, 0.95, 0.92] },
  { id: 103, origin: 'RIO NEGRO', presentation: 'CAJON', quantity: '19 KG.', basePrice: 14000, trendFactor: [1.0, 1.02, 1.01, 1.03, 1.04, 1.02, 1.05, 1.06, 1.05, 1.07] },
  { id: 104, origin: 'ECUADOR', presentation: 'CAJON', quantity: '20 KG.', basePrice: 22000, trendFactor: [1.3, 1.25, 1.20, 1.15, 1.10, 1.05, 1.02, 1.0, 0.98, 0.95] }, // Bajando constante
  { id: 105, origin: 'TUCUMAN', presentation: 'CAJON', quantity: '18 KG.', basePrice: 6500, trendFactor: [1.4, 1.35, 1.30, 1.20, 1.10, 1.05, 1.02, 1.0, 0.98, 0.95] },  // Cerca de mínimo
  { id: 106, origin: 'CORRIENTES', presentation: 'CAJON', quantity: '18 KG.', basePrice: 8000, trendFactor: [1.0, 1.02, 1.05, 1.08, 1.10, 1.08, 1.12, 1.15, 1.14, 1.16] },
  { id: 107, origin: 'ZONA', presentation: 'CAJON', quantity: '5 KG.', basePrice: 12000, trendFactor: [1.0, 1.08, 1.15, 1.25, 1.35, 1.45, 1.55, 1.60, 1.68, 1.75] },
  { id: 108, origin: 'RIO NEGRO', presentation: 'CAJON', quantity: '19 KG.', basePrice: 11000, trendFactor: [1.0, 1.01, 1.02, 1.03, 1.04, 1.03, 1.05, 1.06, 1.07, 1.08] },

  // Verduras
  { id: 201, origin: 'ZONA', presentation: 'JAULA', quantity: '10 PAQ.', basePrice: 7500, trendFactor: [1.3, 1.25, 1.20, 1.15, 1.10, 1.05, 1.02, 1.0, 0.95, 0.90] },  // Bajando racha
  { id: 202, origin: 'ZONA', presentation: 'JAULA', quantity: '12 UNID.', basePrice: 9000, trendFactor: [1.0, 1.05, 1.03, 1.08, 1.12, 1.10, 1.15, 1.18, 1.20, 1.22] },
  { id: 203, origin: 'ZONA', presentation: 'JAULA', quantity: '12 UNID.', basePrice: 8500, trendFactor: [1.0, 1.02, 1.04, 1.03, 1.06, 1.08, 1.10, 1.12, 1.11, 1.13] },
  { id: 204, origin: 'ZONA', presentation: 'JAULA', quantity: '10 PAQ.', basePrice: 6800, trendFactor: [1.35, 1.30, 1.25, 1.20, 1.12, 1.08, 1.04, 1.0, 0.96, 0.92] },
  { id: 205, origin: 'ZONA', presentation: 'PAQUETE', quantity: '10 PAQ.', basePrice: 5500, trendFactor: [1.0, 1.03, 1.05, 1.07, 1.10, 1.12, 1.15, 1.18, 1.20, 1.23] },
  { id: 206, origin: 'ZONA', presentation: 'JAULA', quantity: '10 PAQ.', basePrice: 6000, trendFactor: [1.0, 1.01, 1.03, 1.02, 1.04, 1.06, 1.08, 1.09, 1.11, 1.12] },

  // Hortalizas
  { id: 301, origin: 'CORRIENTES', presentation: 'CAJON', quantity: '18 KG.', basePrice: 15000, trendFactor: [1.0, 1.08, 1.16, 1.25, 1.35, 1.48, 1.60, 1.72, 1.84, 1.95] }, // Cerca de máximo / Top Subas / Racha
  { id: 302, origin: 'SALTA', presentation: 'CAJON', quantity: '18 KG.', basePrice: 14000, trendFactor: [1.0, 1.06, 1.12, 1.20, 1.28, 1.38, 1.48, 1.58, 1.68, 1.78] },
  { id: 303, origin: 'ZONA', presentation: 'CAJON', quantity: '15 KG.', basePrice: 8000, trendFactor: [1.0, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.35, 1.40] },
  { id: 304, origin: 'ZONA', presentation: 'CAJON', quantity: '14 KG.', basePrice: 7000, trendFactor: [1.0, 1.10, 1.25, 1.40, 1.60, 1.85, 2.10, 2.35, 2.50, 2.80] }, // Precio Atípico (x2.8)
  { id: 305, origin: 'MENDOZA', presentation: 'BOLSA', quantity: '20 KG.', basePrice: 9000, trendFactor: [1.0, 1.02, 1.01, 1.03, 1.05, 1.04, 1.06, 1.08, 1.07, 1.09] },
  { id: 306, origin: 'SALTA', presentation: 'CAJON', quantity: '15 KG.', basePrice: 21000, trendFactor: [1.0, 1.05, 1.12, 1.20, 1.30, 1.42, 1.55, 1.68, 1.80, 1.92] }, // Cerca de máximo
  { id: 307, origin: 'BALCARCE', presentation: 'BOLSA', quantity: '20 KG.', basePrice: 8500, trendFactor: [1.0, 1.02, 1.04, 1.03, 1.05, 1.07, 1.09, 1.11, 1.12, 1.14] },
  { id: 308, origin: 'SUR', presentation: 'BOLSA', quantity: '18 KG.', basePrice: 7200, trendFactor: [1.0, 1.03, 1.05, 1.04, 1.07, 1.09, 1.11, 1.13, 1.14, 1.16] },

  // Otros
  { id: 401, origin: 'ZONA', presentation: 'BANDEJA', quantity: '1 KG.', basePrice: 4500, trendFactor: [1.0, 1.02, 1.03, 1.05, 1.06, 1.08, 1.10, 1.12, 1.14, 1.15] },
  { id: 402, origin: 'MENDOZA', presentation: 'CAJA', quantity: '10 KG.', basePrice: 28000, trendFactor: [1.0, 1.04, 1.08, 1.12, 1.15, 1.18, 1.22, 1.25, 1.28, 1.30] }
];

let recordIdCounter = 1;
const recordsList: PriceRecord[] = [];

productConfigs.forEach(cfg => {
  cfg.trendFactor.forEach((factor, idx) => {
    const avg = Math.round(cfg.basePrice * factor);
    const from = Math.round(avg * 0.95);
    const to = Math.round(avg * 1.05);

    recordsList.push({
      id: recordIdCounter++,
      snapshot_date: dates[idx],
      product_id: cfg.id,
      price_from: from,
      price_to: to,
      price_avg: avg,
      origin: cfg.origin,
      presentation: cfg.presentation,
      quantity_raw: cfg.quantity
    });
  });
});

export const MOCK_PRICE_RECORDS: PriceRecord[] = recordsList;
