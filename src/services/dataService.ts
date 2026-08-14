import { createClient } from '@supabase/supabase-js';
import { Category, Product, PriceRecord } from '../types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_PRICE_RECORDS } from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !supabaseUrl;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export async function getCategories(): Promise<Category[]> {
  if (useMock || !supabase) return MOCK_CATEGORIES;
  const { data, error } = await supabase.from('categories').select('*').order('id');
  if (error || !data) return MOCK_CATEGORIES;
  return data;
}

export async function getProducts(categoryId: number): Promise<Product[]> {
  if (useMock || !supabase) {
    return MOCK_PRODUCTS.filter(p => p.category_id === categoryId);
  }
  const { data, error } = await supabase.from('products').select('*').eq('category_id', categoryId).order('name');
  if (error || !data) return MOCK_PRODUCTS.filter(p => p.category_id === categoryId);
  return data;
}

export async function getPriceHistory(productId: number): Promise<PriceRecord[]> {
  if (useMock || !supabase) {
    return MOCK_PRICE_RECORDS.filter(r => r.product_id === productId).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  }
  const { data, error } = await supabase.from('price_records').select('*').eq('product_id', productId).order('snapshot_date', { ascending: true });
  if (error || !data) return MOCK_PRICE_RECORDS.filter(r => r.product_id === productId);
  return data;
}
