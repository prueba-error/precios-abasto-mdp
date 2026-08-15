export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  original_id: string;
  name: string;
  category_id: number;
}

export interface PriceRecord {
  id: number;
  snapshot_date: string;
  product_id: number;
  price_from: number | null;
  price_to: number | null;
  price_avg: number | null;
  origin: string | null;
  presentation: string | null;
  quantity_raw: string | null;
}

export interface PinnedProduct {
  pinnedId: string;
  productId: number;
  categoryId: number;
  productName: string;
  color: string;
}

export type PriceMetric = 'price_avg' | 'price_from' | 'price_to';
