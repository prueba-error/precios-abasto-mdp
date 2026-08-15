import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { PriceChart } from './components/PriceChart';
import { PriceTable } from './components/PriceTable';
import { Footer } from './components/Footer';
import { Category, Product, PriceRecord, PriceMetric, PinnedProduct } from './types';
import { getCategories, getProducts, getPriceHistory, getCategoryAllProductsRecords, getBasketOptionForCategory, getDefaultViewConfig, ExtendedPriceRecord, isUsingMock } from './services/dataService';

const COLOR_PALETTE = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProductsList, setAllProductsList] = useState<Product[]>([]);
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [categoryProductsRecords, setCategoryProductsRecords] = useState<ExtendedPriceRecord[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = 'Todas las categorías'
  const [selectedProduct, setSelectedProduct] = useState<number>(0);   // 0 = 'Todos los productos'
  const [selectedMetric, setSelectedMetric] = useState<PriceMetric>('price_avg');

  const [pinnedProducts, setPinnedProducts] = useState<PinnedProduct[]>([]);
  const [pinnedHistories, setPinnedHistories] = useState<{ [pinnedId: string]: PriceRecord[] }>({});

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    getProducts(0, categories).then(prods => {
      setAllProductsList(prods);
    });
  }, [categories]);

  useEffect(() => {
    getProducts(selectedCategory, categories).then(prods => {
      setProducts(prods);
      if (!prods.some(p => p.id === selectedProduct)) {
        setSelectedProduct(0);
      }
    });
  }, [selectedCategory, categories]);

  useEffect(() => {
    getPriceHistory(selectedProduct, selectedCategory).then(recs => setRecords(recs));
    
    if (selectedProduct === 0) {
      getCategoryAllProductsRecords(selectedCategory).then(recs => setCategoryProductsRecords(recs));
    } else {
      setCategoryProductsRecords([]);
    }
  }, [selectedProduct, selectedCategory]);

  // Fetch histories for all pinned products using pinnedId
  useEffect(() => {
    pinnedProducts.forEach(pinned => {
      if (!pinnedHistories[pinned.pinnedId]) {
        getPriceHistory(pinned.productId, pinned.categoryId).then(recs => {
          setPinnedHistories(prev => ({ ...prev, [pinned.pinnedId]: recs }));
        });
      }
    });
  }, [pinnedProducts]);

  const activeCategory = categories.find(c => c.id === selectedCategory);
  const basketOption = getBasketOptionForCategory(selectedCategory, categories);
  const activeProduct = selectedProduct === 0
    ? basketOption
    : (products.find(p => p.id === selectedProduct) || basketOption);
  
  const currentPinnedId = `cat_${selectedCategory}_prod_${selectedProduct}`;
  const isCurrentPinned = pinnedProducts.some(p => p.pinnedId === currentPinnedId);

  const handleTogglePin = () => {
    if (isCurrentPinned) {
      handleUnpinProduct(currentPinnedId);
    } else {
      const colorIndex = pinnedProducts.length % COLOR_PALETTE.length;
      const newPinned: PinnedProduct = {
        pinnedId: currentPinnedId,
        productId: selectedProduct,
        categoryId: selectedCategory,
        productName: activeProduct.name,
        color: COLOR_PALETTE[colorIndex]
      };
      setPinnedProducts(prev => [...prev, newPinned]);
    }
  };

  const handleUnpinProduct = (pinnedId: string) => {
    setPinnedProducts(prev => prev.filter(p => p.pinnedId !== pinnedId));
    setPinnedHistories(prev => {
      const copy = { ...prev };
      delete copy[pinnedId];
      return copy;
    });
  };

  const handleClearPinned = () => {
    setPinnedProducts([]);
    setPinnedHistories({});
  };

  const handleResetChart = () => {
    const defaultConfig = getDefaultViewConfig();
    setSelectedCategory(defaultConfig.categoryId);
    setSelectedProduct(defaultConfig.productId);
    setSelectedMetric(defaultConfig.metric);
    if (defaultConfig.clearPinned) {
      handleClearPinned();
    }
  };

  const handleSelectProductFromSearch = (product: Product) => {
    setSelectedCategory(product.category_id);
    setSelectedProduct(product.id);
  };

  const latestDate = records.length > 0 ? records[records.length - 1].snapshot_date : undefined;

  return (
    <div className="container">
      <Header isMock={isUsingMock} lastUpdated={latestDate} />
      <Filters 
        categories={categories}
        products={products}
        allProducts={allProductsList}
        selectedCategory={selectedCategory}
        selectedProduct={selectedProduct}
        selectedMetric={selectedMetric}
        pinnedProducts={pinnedProducts}
        isCurrentPinned={isCurrentPinned}
        onCategoryChange={setSelectedCategory}
        onProductChange={setSelectedProduct}
        onMetricChange={setSelectedMetric}
        onTogglePin={handleTogglePin}
        onUnpinProduct={(pinnedId: string) => handleUnpinProduct(pinnedId)}
        onClearPinned={handleClearPinned}
        onResetChart={handleResetChart}
        onSelectProductFromSearch={handleSelectProductFromSearch}
      />
      {records.length > 0 ? (
        <>
          <PriceChart 
            records={records} 
            metric={selectedMetric} 
            productName={activeProduct.name}
            activeProductId={selectedProduct}
            activePinnedId={currentPinnedId}
            categoryName={activeCategory?.name}
            pinnedProducts={pinnedProducts}
            pinnedHistories={pinnedHistories}
          />
          <PriceTable 
            records={records} 
            selectedMetric={selectedMetric}
            activeProductName={activeProduct.name}
            activePinnedId={currentPinnedId}
            isAllProducts={selectedProduct === 0}
            categoryProductsRecords={categoryProductsRecords}
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
