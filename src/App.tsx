import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { PriceChart } from './components/PriceChart';
import { PriceTable } from './components/PriceTable';
import { Footer } from './components/Footer';
import { Category, Product, PriceRecord, PriceMetric, PinnedProduct } from './types';
import { getCategories, getProducts, getPriceHistory, isUsingMock } from './services/dataService';

const COLOR_PALETTE = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<PriceRecord[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = 'Todas las categorías'
  const [selectedProduct, setSelectedProduct] = useState<number>(0);   // 0 = 'Todos los productos'
  const [selectedMetric, setSelectedMetric] = useState<PriceMetric>('price_avg');

  const [pinnedProducts, setPinnedProducts] = useState<PinnedProduct[]>([]);
  const [pinnedHistories, setPinnedHistories] = useState<{ [productId: number]: PriceRecord[] }>({});

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    getProducts(selectedCategory).then(prods => {
      setProducts(prods);
      if (!prods.some(p => p.id === selectedProduct)) {
        setSelectedProduct(0);
      }
    });
  }, [selectedCategory]);

  useEffect(() => {
    getPriceHistory(selectedProduct, selectedCategory).then(recs => setRecords(recs));
  }, [selectedProduct, selectedCategory]);

  // Fetch histories for all pinned products
  useEffect(() => {
    pinnedProducts.forEach(pinned => {
      if (!pinnedHistories[pinned.productId]) {
        getPriceHistory(pinned.productId, pinned.categoryId).then(recs => {
          setPinnedHistories(prev => ({ ...prev, [pinned.productId]: recs }));
        });
      }
    });
  }, [pinnedProducts]);

  const activeCategory = categories.find(c => c.id === selectedCategory);
  const activeProduct = products.find(p => p.id === selectedProduct) || { id: 0, name: 'Todos los productos (Promedio General)', category_id: 0 };
  const isCurrentPinned = pinnedProducts.some(p => p.productId === selectedProduct);

  const handleTogglePin = () => {
    if (isCurrentPinned) {
      handleUnpinProduct(selectedProduct);
    } else {
      const colorIndex = pinnedProducts.length % COLOR_PALETTE.length;
      const newPinned: PinnedProduct = {
        productId: selectedProduct,
        categoryId: selectedCategory,
        productName: activeProduct.name,
        color: COLOR_PALETTE[colorIndex]
      };
      setPinnedProducts(prev => [...prev, newPinned]);
    }
  };

  const handleUnpinProduct = (prodId: number) => {
    setPinnedProducts(prev => prev.filter(p => p.productId !== prodId));
    setPinnedHistories(prev => {
      const copy = { ...prev };
      delete copy[prodId];
      return copy;
    });
  };

  const handleClearPinned = () => {
    setPinnedProducts([]);
    setPinnedHistories({});
  };

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
        pinnedProducts={pinnedProducts}
        isCurrentPinned={isCurrentPinned}
        onCategoryChange={setSelectedCategory}
        onProductChange={setSelectedProduct}
        onMetricChange={setSelectedMetric}
        onTogglePin={handleTogglePin}
        onUnpinProduct={handleUnpinProduct}
        onClearPinned={handleClearPinned}
      />
      {records.length > 0 ? (
        <>
          <PriceChart 
            records={records} 
            metric={selectedMetric} 
            productName={activeProduct.name}
            activeProductId={selectedProduct}
            categoryName={activeCategory?.name}
            pinnedProducts={pinnedProducts}
            pinnedHistories={pinnedHistories}
          />
          <PriceTable 
            records={records} 
            selectedMetric={selectedMetric}
            activeProductName={activeProduct.name}
            pinnedProducts={pinnedProducts}
            pinnedHistories={pinnedHistories}
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          No hay datos de precios disponibles para la selección actual.
        </div>
      )}
      <Footer />
    </div>
  );
}
export default App;
