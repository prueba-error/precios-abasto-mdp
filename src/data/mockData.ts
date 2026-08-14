import { Category, Product, PriceRecord } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Frutas' },
  { id: 2, name: 'Verduras' },
  { id: 3, name: 'Hortalizas' },
  { id: 4, name: 'Otros' }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 101, original_id: '198', name: 'MANDARINA OKITSU', category_id: 1 },
  { id: 102, original_id: '27', name: 'MANGO', category_id: 1 },
  { id: 103, original_id: '29', name: 'MANZANA DELICIOSA', category_id: 1 },
  { id: 201, original_id: '57', name: 'ACELGA', category_id: 2 },
  { id: 202, original_id: '65', name: 'LECHUGA CAPUCHINA', category_id: 2 }
];

const dates = ['2026-06-22', '2026-06-29', '2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10'];

export const MOCK_PRICE_RECORDS: PriceRecord[] = [
  { id: 1, snapshot_date: dates[0], product_id: 101, price_from: 9000, price_to: 10000, price_avg: 9500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 2, snapshot_date: dates[1], product_id: 101, price_from: 9500, price_to: 10500, price_avg: 10000, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 3, snapshot_date: dates[2], product_id: 101, price_from: 10000, price_to: 11000, price_avg: 10500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 4, snapshot_date: dates[3], product_id: 101, price_from: 10500, price_to: 11500, price_avg: 11000, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 5, snapshot_date: dates[4], product_id: 101, price_from: 11000, price_to: 12000, price_avg: 11500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 6, snapshot_date: dates[5], product_id: 101, price_from: 11500, price_to: 12000, price_avg: 11750, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 7, snapshot_date: dates[6], product_id: 101, price_from: 12000, price_to: 12500, price_avg: 12250, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 8, snapshot_date: dates[7], product_id: 101, price_from: 12000, price_to: 13000, price_avg: 12500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  
  { id: 9, snapshot_date: dates[0], product_id: 201, price_from: 7000, price_to: 8000, price_avg: 7500, origin: 'ZONA', presentation: 'JAULA', quantity_raw: '10 PAQUETES' },
  { id: 10, snapshot_date: dates[7], product_id: 201, price_from: 10000, price_to: 11000, price_avg: 10500, origin: 'ZONA', presentation: 'JAULA', quantity_raw: '10 PAQUETES' }
];
