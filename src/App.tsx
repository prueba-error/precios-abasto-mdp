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
  
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<number>(101);
  const [selectedMetric, setSelectedMetric] = useState<PriceMetric>('price_avg');

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getProducts(selectedCategory).then(prods => {
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedProduct(prods[0].id);
        } else {
          setRecords([]);
        }
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedProduct) {
      getPriceHistory(selectedProduct).then(recs => setRecords(recs));
    }
  }, [selectedProduct]);

  const activeProduct = products.find(p => p.id === selectedProduct);
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
      {records.length > 0 && activeProduct ? (
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
