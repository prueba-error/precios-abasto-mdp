import { createClient } from '@supabase/supabase-js';
import { Category, Product, PriceRecord } from '../types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_PRICE_RECORDS } from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isUsingMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !supabaseUrl || !supabaseAnonKey;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const ALL_CATEGORIES_OPTION: Category = { id: 0, name: 'Todas' };
export const ALL_PRODUCTS_OPTION: Product = { id: 0, original_id: 'ALL', name: 'Todos (Promedio General)', category_id: 0 };

export async function getCategories(): Promise<Category[]> {
  if (isUsingMock || !supabase) {
    return [ALL_CATEGORIES_OPTION, ...MOCK_CATEGORIES];
  }
  const { data, error } = await supabase.from('categories').select('*').order('id');
  if (error || !data) return [ALL_CATEGORIES_OPTION, ...MOCK_CATEGORIES];
  return [ALL_CATEGORIES_OPTION, ...data];
}

export async function getProducts(categoryId: number): Promise<Product[]> {
  let list: Product[] = [];
  if (isUsingMock || !supabase) {
    if (categoryId === 0) {
      list = [...MOCK_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = MOCK_PRODUCTS.filter(p => p.category_id === categoryId).sort((a, b) => a.name.localeCompare(b.name));
    }
  } else {
    let query = supabase.from('products').select('*').order('name');
    if (categoryId !== 0) {
      query = query.eq('category_id', categoryId);
    }
    const { data, error } = await query;
    if (error || !data) {
      list = categoryId === 0 ? MOCK_PRODUCTS : MOCK_PRODUCTS.filter(p => p.category_id === categoryId);
    } else {
      list = data;
    }
  }
  return [ALL_PRODUCTS_OPTION, ...list];
}

export async function getPriceHistory(productId: number, categoryId: number): Promise<PriceRecord[]> {
  if (productId === 0) {
    return getAggregatedPriceHistory(categoryId);
  }

  if (isUsingMock || !supabase) {
    return MOCK_PRICE_RECORDS
      .filter(r => r.product_id === productId)
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  }
  const { data, error } = await supabase
    .from('price_records')
    .select('*')
    .eq('product_id', productId)
    .order('snapshot_date', { ascending: true });
  if (error || !data) return MOCK_PRICE_RECORDS.filter(r => r.product_id === productId);
  return data;
}

async function getAggregatedPriceHistory(categoryId: number): Promise<PriceRecord[]> {
  let records: PriceRecord[] = [];

  if (isUsingMock || !supabase) {
    let validProductIds = MOCK_PRODUCTS.map(p => p.id);
    if (categoryId !== 0) {
      validProductIds = MOCK_PRODUCTS.filter(p => p.category_id === categoryId).map(p => p.id);
    }
    records = MOCK_PRICE_RECORDS.filter(r => validProductIds.includes(r.product_id));
  } else {
    if (categoryId === 0) {
      const { data } = await supabase.from('price_records').select('*');
      records = data || [];
    } else {
      const { data: prods } = await supabase.from('products').select('id').eq('category_id', categoryId);
      const prodIds = (prods || []).map(p => p.id);
      if (prodIds.length > 0) {
        const { data } = await supabase.from('price_records').select('*').in('product_id', prodIds);
        records = data || [];
      }
    }
  }

  // Group by snapshot_date and average prices
  const groups: { [date: string]: { avg: number[]; from: number[]; to: number[] } } = {};
  for (const r of records) {
    if (!groups[r.snapshot_date]) {
      groups[r.snapshot_date] = { avg: [], from: [], to: [] };
    }
    if (r.price_avg !== null) groups[r.snapshot_date].avg.push(Number(r.price_avg));
    if (r.price_from !== null) groups[r.snapshot_date].from.push(Number(r.price_from));
    if (r.price_to !== null) groups[r.snapshot_date].to.push(Number(r.price_to));
  }

  const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  let mockId = 9000;

  return sortedDates.map(date => {
    const group = groups[date];
    const avgVal = group.avg.length > 0 ? roundVal(group.avg.reduce((a, b) => a + b, 0) / group.avg.length) : null;
    const fromVal = group.from.length > 0 ? roundVal(group.from.reduce((a, b) => a + b, 0) / group.from.length) : null;
    const toVal = group.to.length > 0 ? roundVal(group.to.reduce((a, b) => a + b, 0) / group.to.length) : null;
    mockId++;

    return {
      id: mockId,
      snapshot_date: date,
      product_id: 0,
      price_from: fromVal,
      price_to: toVal,
      price_avg: avgVal,
      origin: categoryId === 0 ? 'Todas las Categorías' : 'Categoría Específica',
      presentation: 'Promedio Canasta',
      quantity_raw: null
    };
  });
}

function roundVal(val: number): number {
  return Math.round(val * 100) / 100;
}
