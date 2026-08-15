import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { PriceChart } from './components/PriceChart';
import { PriceTable } from './components/PriceTable';
import { Category, Product, PriceRecord, PriceMetric } from './types';
import { getCategories, getProducts, getPriceHistory, isUsingMock } from './services/dataService';

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<PriceRecord[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = 'Todas'
  const [selectedProduct, setSelectedProduct] = useState<number>(0);   // 0 = 'Todos'
  const [selectedMetric, setSelectedMetric] = useState<PriceMetric>('price_avg');

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    getProducts(selectedCategory).then(prods => {
      setProducts(prods);
      // Keep selected product 0 (Todos) or fallback if product no longer exists
      if (!prods.some(p => p.id === selectedProduct)) {
        setSelectedProduct(0);
      }
    });
  }, [selectedCategory]);

  useEffect(() => {
    getPriceHistory(selectedProduct, selectedCategory).then(recs => setRecords(recs));
  }, [selectedProduct, selectedCategory]);

  const activeProduct = products.find(p => p.id === selectedProduct) || { name: 'Todos los Productos (Promedio Canasta)' };
  const latestDate = records.length > 0 ? records[records.length - 1].snapshot_date : undefined;

  return (
    <div className="container">
      <Header isMock={isUsingMock} lastUpdated={latestDate} />
      <Filters 
        categories={categories}
        products={products}
        selectedCategory={selectedCategory}
        selectedProduct={selectedProduct}
        selectedMetric={selectedMetric}
        onCategoryChange={setSelectedCategory}
        onProductChange={setSelectedProduct}
        onMetricChange={setSelectedMetric}
      />
      {records.length > 0 ? (
        <>
          <PriceChart records={records} metric={selectedMetric} productName={activeProduct.name} />
          <PriceTable records={records} selectedMetric={selectedMetric} />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          No hay datos de precios disponibles para la selección actual.
        </div>
      )}
    </div>
  );
}
export default App;
