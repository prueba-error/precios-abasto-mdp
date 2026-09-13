import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MarketInsights } from './components/MarketInsights';
import { Filters } from './components/Filters';
import { PriceChart } from './components/PriceChart';
import { ProductInsights } from './components/ProductInsights';
import { PriceTable } from './components/PriceTable';
import { Footer } from './components/Footer';
import { Category, Product, PriceRecord, PriceMetric, PinnedProduct } from './types';
import { getCategories, getProducts, getPriceHistory, getCategoryAllProductsRecords, getBasketOptionForCategory, getDefaultViewConfig, ExtendedPriceRecord, isUsingMock } from './services/dataService';
import { computeMarketInsights, computeProductInsights } from './utils/insightsUtils';

const COLOR_PALETTE = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProductsList, setAllProductsList] = useState<Product[]>([]);
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [categoryProductsRecords, setCategoryProductsRecords] = useState<ExtendedPriceRecord[]>([]);
  const [globalMarketRecords, setGlobalMarketRecords] = useState<PriceRecord[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = 'Todas las categorías'
  const [selectedProduct, setSelectedProduct] = useState<number>(0);   // 0 = 'Todos los productos'
  const [selectedMetric, setSelectedMetric] = useState<PriceMetric>('price_avg');

  const [pinnedProducts, setPinnedProducts] = useState<PinnedProduct[]>([]);
  const [pinnedHistories, setPinnedHistories] = useState<{ [pinnedId: string]: PriceRecord[] }>({});

  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
    });
    getCategoryAllProductsRecords(0).then(recs => setGlobalMarketRecords(recs));
  }, []);

  useEffect(() => {
    getProducts(0, categories).then(prods => {
      setAllProductsList(prods);
    });
  }, [categories]);

  useEffect(() => {
    getProducts(selectedCategory, categories).then(prods => {
      setProducts(prods);
      if (selectedCategory !== -1 && !prods.some(p => p.id === selectedProduct)) {
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
    setPinnedProducts(prev => {
      const next = prev.filter(p => p.pinnedId !== pinnedId);
      if (next.length === 0 && (selectedCategory <= 0 && selectedProduct <= 0)) {
        setSelectedCategory(0);
        setSelectedProduct(0);
      }
      return next;
    });
    setPinnedHistories(prev => {
      const copy = { ...prev };
      delete copy[pinnedId];
      return copy;
    });
  };

  const [chartTitleOverride, setChartTitleOverride] = useState<string | null>(null);

  const handleClearPinned = () => {
    setPinnedProducts([]);
    setPinnedHistories({});
    setChartTitleOverride(null);
    if (selectedCategory <= 0 && selectedProduct <= 0) {
      setSelectedCategory(0);
      setSelectedProduct(0);
    }
  };

  const handleResetChart = () => {
    const defaultConfig = getDefaultViewConfig();
    setSelectedCategory(defaultConfig.categoryId);
    setSelectedProduct(defaultConfig.productId);
    setSelectedMetric(defaultConfig.metric);
    setChartTitleOverride(null);
    if (defaultConfig.clearPinned) {
      handleClearPinned();
    }
  };

  const handleSelectProductFromSearch = (product: Product) => {
    setSelectedCategory(product.category_id);
    setSelectedProduct(product.id);
    setChartTitleOverride(null);
  };

  const handlePinProductFromSearch = (product: Product) => {
    setSelectedCategory(product.category_id);
    setSelectedProduct(product.id);
    handleTogglePinItem(product.id, product.category_id, product.name);
  };

  const handleTogglePinItem = (productId: number, categoryId: number, productName: string) => {
    const targetPinnedId = `cat_${categoryId}_prod_${productId}`;
    const isPinned = pinnedProducts.some(p => p.pinnedId === targetPinnedId);
    if (isPinned) {
      handleUnpinProduct(targetPinnedId);
    } else {
      const colorIndex = pinnedProducts.length % COLOR_PALETTE.length;
      const newPinned: PinnedProduct = {
        pinnedId: targetPinnedId,
        productId,
        categoryId,
        productName,
        color: COLOR_PALETTE[colorIndex]
      };
      setPinnedProducts(prev => [...prev, newPinned]);
    }
  };

  const handleSelectProductItem = (productId: number, categoryId: number) => {
    if (categoryId !== selectedCategory) {
      setSelectedCategory(categoryId);
    }
    setSelectedProduct(productId);
    setChartTitleOverride(null);
  };

  const latestDate = records.length > 0 ? records[records.length - 1].snapshot_date : undefined;

  const marketInsightsData = useMemo(() => {
    const dataset = globalMarketRecords.length > 0 
      ? globalMarketRecords 
      : (categoryProductsRecords.length > 0 ? categoryProductsRecords : records);
    return computeMarketInsights(allProductsList, dataset);
  }, [allProductsList, globalMarketRecords, categoryProductsRecords, records]);

  const productInsightsData = useMemo(() => {
    return computeProductInsights(activeProduct, records, null);
  }, [activeProduct, records]);

  const handleViewSectionInChart = (section: 'subas' | 'bajas' | 'rachas' | 'all') => {
    let highlightItems: Array<{ product_id?: number; product_name: string }> = [];
    if (section === 'subas') {
      highlightItems = marketInsightsData.topSubas;
      setChartTitleOverride('Top subas');
    } else if (section === 'bajas') {
      highlightItems = marketInsightsData.topBajas;
      setChartTitleOverride('Top bajas');
    } else if (section === 'rachas') {
      highlightItems = marketInsightsData.rachasActivas;
      setChartTitleOverride('Rachas activas');
    } else {
      highlightItems = [
        ...marketInsightsData.topSubas,
        ...marketInsightsData.topBajas,
        ...marketInsightsData.rachasActivas
      ];
      setChartTitleOverride('Top subas, bajas y rachas');
    }

    const isCurrentlyPinned = selectedProduct > 0 && pinnedProducts.some(p => p.productId === selectedProduct);

    const newPinnedProducts: PinnedProduct[] = [];

    // If active product was explicitly pinned, keep it pinned
    if (isCurrentlyPinned) {
      const currentPinnedObj = pinnedProducts.find(p => p.productId === selectedProduct);
      if (currentPinnedObj) {
        newPinnedProducts.push(currentPinnedObj);
      }
    } else {
      setSelectedCategory(-1);
      setSelectedProduct(-1);
    }

    highlightItems.forEach(item => {
      const prod = allProductsList.find(p => p.id === item.product_id || p.name === item.product_name);
      if (prod) {
        const targetPinnedId = `cat_${prod.category_id}_prod_${prod.id}`;
        if (!newPinnedProducts.some(p => p.pinnedId === targetPinnedId)) {
          const colorIndex = newPinnedProducts.length % COLOR_PALETTE.length;
          newPinnedProducts.push({
            pinnedId: targetPinnedId,
            productId: prod.id,
            categoryId: prod.category_id,
            productName: prod.name,
            color: COLOR_PALETTE[colorIndex]
          });
        }
      }
    });

    setPinnedProducts(newPinnedProducts);

    const chartElem = document.querySelector('.price-chart-card') || document.querySelector('.recharts-responsive-container');
    if (chartElem) {
      chartElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleViewInsightsInChart = () => {
    handleViewSectionInChart('all');
  };

  const handleSelectProductFromList = (productId?: number, productName?: string) => {
    const prod = allProductsList.find(p => (productId && p.id === productId) || p.name === productName);
    if (prod) {
      setSelectedCategory(prod.category_id);
      setSelectedProduct(prod.id);
      setChartTitleOverride(null);
      const chartElem = document.querySelector('.price-chart-card') || document.querySelector('.recharts-responsive-container');
      if (chartElem) {
        chartElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        isMock={isUsingMock}
        lastUpdated={latestDate}
        allProducts={allProductsList}
        categories={categories}
        onSelectProductFromSearch={handleSelectProductFromSearch}
        onPinProductFromSearch={handlePinProductFromSearch}
        onResetHome={handleResetChart}
      />
      <div className="container">
        {/* 1. Componente Insights Generales (Ubicado antes de los filtros) */}
        <MarketInsights 
          data={marketInsightsData} 
          onViewInChart={handleViewInsightsInChart} 
          onViewSectionInChart={(sec) => handleViewSectionInChart(sec)}
          onSelectProductItem={handleSelectProductFromList}
        />

        <Filters 
          categories={categories}
          products={products}
          allProducts={allProductsList}
          selectedCategory={selectedCategory}
          selectedProduct={selectedProduct}
          pinnedProducts={pinnedProducts}
          isCurrentPinned={isCurrentPinned}
          hoveredSeries={hoveredSeries}
          onHoverSeries={setHoveredSeries}
          onCategoryChange={(catId) => { 
            if (catId === -1 && pinnedProducts.length === 0) {
              setSelectedCategory(0);
              setSelectedProduct(0);
            } else {
              setSelectedCategory(catId); 
              if (catId === -1) {
                setSelectedProduct(-1);
              } else if (selectedProduct === -1) {
                setSelectedProduct(0);
              }
            }
            setChartTitleOverride(null); 
          }}
          onProductChange={(prodId) => { 
            if (prodId > 0 && selectedCategory === -1) {
              const prodObj = allProductsList.find(p => p.id === prodId);
              if (prodObj) {
                setSelectedCategory(prodObj.category_id);
              }
            } else if (prodId === -1) {
              if (pinnedProducts.length === 0) {
                setSelectedCategory(0);
                setSelectedProduct(0);
                setChartTitleOverride(null); 
                return;
              }
              setSelectedCategory(-1);
            }
            setSelectedProduct(prodId); 
            setChartTitleOverride(null); 
          }}
          onTogglePin={handleTogglePin}
          onUnpinProduct={(pinnedId: string) => handleUnpinProduct(pinnedId)}
          onClearPinned={handleClearPinned}
          onResetChart={handleResetChart}
          onSelectProductFromSearch={handleSelectProductFromSearch}
          onPinProductFromSearch={handlePinProductFromSearch}
          onSelectProductItem={handleSelectProductFromList}
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
              chartTitleOverride={chartTitleOverride}
              hoveredSeries={hoveredSeries}
              onHoverSeries={setHoveredSeries}
              onSelectProductItem={handleSelectProductFromList}
            />

            {/* 2. Componente Insights Producto (Ubicado a continuación del gráfico) */}
            <ProductInsights selectedProduct={activeProduct} data={productInsightsData} />

            <PriceTable 
              records={records} 
              selectedMetric={selectedMetric}
              activeProductName={activeProduct.name}
              activePinnedId={currentPinnedId}
              selectedCategory={selectedCategory}
              selectedProduct={selectedProduct}
              isAllProducts={selectedProduct === 0}
              categoryProductsRecords={categoryProductsRecords}
              pinnedProducts={pinnedProducts}
              pinnedHistories={pinnedHistories}
              isMock={isUsingMock}
              lastUpdated={latestDate}
              onTogglePinItem={handleTogglePinItem}
              onSelectProductItem={handleSelectProductItem}
            />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          No hay datos de precios disponibles para la selección actual.
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
}
export default App;
