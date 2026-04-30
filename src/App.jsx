import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, ShoppingBag, ChevronRight, Star, MessageCircle, Ruler, Shield, LayoutDashboard } from 'lucide-react';
import Papa from 'papaparse';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_PonAquiTuClavePublicaDeStripe');


import productsData from './data/products.json';

const SIZE_GUIDES = {
  "Básico Escolar": {
    headers: ["Talla", "Pecho (cm)", "Largo (cm)", "Manga (cm)"],
    rows: [
      ["4", "36", "48", "15"],
      ["6", "38", "51", "16"],
      ["8", "40", "54", "17"],
      ["10", "42", "57", "18"],
      ["12", "44", "60", "19"],
      ["14", "46", "63", "20"],
      ["16", "48", "66", "21"],
      ["18", "50", "69", "22"]
    ]
  },
  "Educación Física": {
    headers: ["Talla", "Cintura (cm)", "Cadera (cm)", "Largo (cm)"],
    rows: [
      ["4", "24-30", "36", "65"],
      ["6", "26-32", "38", "70"],
      ["8", "28-34", "40", "75"],
      ["10", "30-36", "42", "80"],
      ["12", "32-38", "44", "85"],
      ["14", "34-40", "46", "90"],
      ["16", "36-42", "48", "95"]
    ]
  },
  "Invierno": {
    headers: ["Talla", "Pecho (cm)", "Largo (cm)", "Manga larga (cm)"],
    rows: [
      ["S", "50", "66", "60"],
      ["M", "53", "68", "62"],
      ["L", "56", "70", "64"],
      ["XL", "59", "72", "66"]
    ]
  }
};

const ProductCard = ({ product, onAddToCart }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const handleAdd = () => {
    if (!selectedSize) {
      alert('Por favor selecciona una talla');
      return;
    }
    onAddToCart(product, selectedSize);
  };

  const nextImg = (e) => {
    e.stopPropagation();
    setLightboxImg((prev) => (prev + 1) % product.images.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setLightboxImg((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <>
      <motion.div 
        className="product-card" 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="product-img" onClick={() => { setLightboxImg(activeImg); setIsLightboxOpen(true); }}>
          <AnimatePresence mode='wait'>
            <motion.img 
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={product.images[activeImg]} 
              alt={product.name}
              className="main-product-img"
            />
          </AnimatePresence>
          
          {product.images.length > 1 && (
            <div className="img-thumbnails">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  className={`thumb-btn ${activeImg === idx ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg(idx);
                  }}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}

          <div className="product-overlay">
            <button onClick={(e) => { e.stopPropagation(); handleAdd(); }} className="btn-quick-add">
              Añadir al Carrito
            </button>
          </div>
        </div>
        <div className="product-info">
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
            <div className="rating">
              <Star size={12} fill="#EAB308" color="#EAB308" />
              <span>{product.rating}</span>
            </div>
          </div>
          <h3 className="product-name">{product.name}</h3>
          
          <div className="size-selector">
            <div className="size-header">
              <p>Talla:</p>
              <button className="btn-size-guide" onClick={(e) => { e.stopPropagation(); setIsSizeGuideOpen(true); }}>
                <Ruler size={14} /> Guía de tallas
              </button>
            </div>
            <div className="size-options">
              {product.sizes.map(size => (
                <button 
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="product-footer">
            <span className="product-price">${product.price.toLocaleString()} MXN</span>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn-add"
              onClick={handleAdd}
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button className="lightbox-close" onClick={() => setIsLightboxOpen(false)}>
              <X size={32} />
            </button>
            
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-nav prev" onClick={prevImg}>
                <Minus size={32} />
              </button>
              
              <motion.img 
                key={lightboxImg}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={product.images[lightboxImg]} 
                alt={product.name}
                className="lightbox-img"
              />

              <button className="lightbox-nav next" onClick={nextImg}>
                <Plus size={32} />
              </button>

              <div className="lightbox-counter">
                {lightboxImg + 1} / {product.images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <motion.div 
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSizeGuideOpen(false)}
          >
            <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setIsSizeGuideOpen(false)}>
                <X size={24} />
              </button>
              
              <h3>Guía de Tallas: {product.name}</h3>
              <p className="size-guide-desc">Medidas aproximadas en centímetros tomadas sobre la prenda en plano.</p>
              
              {SIZE_GUIDES[product.category] ? (
                <div className="table-responsive">
                  <table className="size-guide-table">
                    <thead>
                      <tr>
                        {SIZE_GUIDES[product.category].headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_GUIDES[product.category].rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className={j === 0 ? 'size-bold' : ''}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay guía disponible para esta categoría.</p>
              )}
              
              <div className="size-guide-tips">
                <strong>¿Cómo medirte?</strong>
                <ul>
                  <li><strong>Pecho/Ancho:</strong> Mide de axila a axila sobre una prenda estirada.</li>
                  <li><strong>Largo:</strong> Desde el punto más alto del hombro hasta el dobladillo inferior.</li>
                  <li><strong>Cintura:</strong> Mide el contorno sin estirar el elástico.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const CheckoutForm = ({ onPaymentSuccess, cartTotal, finalShippingPrice }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      // Requisito de Stripe: validar el formulario antes de confirmar
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setProcessing(false);
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          await onPaymentSuccess();
        } else {
          // Si el estado no es succeeded pero no hubo error explícito
          setProcessing(false);
        }
      }
    } catch (err) {
      console.error("Error inesperado en Stripe:", err);
      setError("Ocurrió un error inesperado al procesar el pago.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <PaymentElement className="stripe-payment-element" />
      {error && <div className="stripe-error" style={{color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 'bold'}}>{error}</div>}
      <button 
        disabled={!stripe || processing} 
        className="btn-checkout btn-pay"
        type="submit"
        style={{ marginTop: '1.5rem', opacity: (!stripe || processing) ? 0.7 : 1 }}
      >
        {processing ? 'Procesando Pago...' : `Pagar $${(cartTotal + finalShippingPrice).toLocaleString()} MXN`}
      </button>
    </form>
  );
};

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState(productsData);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'shipping', 'payment', 'success'
  const [view, setView] = useState('shop'); // 'shop' or 'admin'
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('uniformespro_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    cp: '',
    estado: ''
  });
  const [clientSecret, setClientSecret] = useState('');
  const [isFetchingSecret, setIsFetchingSecret] = useState(false);

  const handleGoToPayment = async () => {
    if (cart.length === 0) return;
    setIsFetchingSecret(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    try {
      const res = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          shipping: { ...shippingInfo, rate: selectedRate } 
        })
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCheckoutStep('payment');
      } else {
        alert('Error al inicializar pago: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al conectar con el servidor de pagos.');
    } finally {
      setIsFetchingSecret(false);
    }
  };


  useEffect(() => {
    Papa.parse('/productos.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data
          .filter(row => row.id)
          .map(row => ({
            ...row,
            id: parseInt(row.id),
            price: parseFloat(row.price),
            rating: parseFloat(row.rating),
            sizes: row.sizes ? row.sizes.split(';') : [],
            images: row.images ? row.images.split(';') : []
          }));
        setProducts(formatted);
      }
    });
  }, []);

  const addToCart = (product, size) => {
    setCart(prev => {
      const cartItemId = `${product.id}-${size}`;
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, size, cartItemId, currentImg: product.images[0] }];
    });
    setCheckoutStep('cart');
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const getStateByZipCode = (zip) => {
    const prefix = parseInt(zip.substring(0, 2));
    if (prefix >= 1 && prefix <= 16) return "Ciudad de México";
    if (prefix === 20) return "Aguascalientes";
    if (prefix >= 21 && prefix <= 22) return "Baja California";
    if (prefix === 23) return "Baja California Sur";
    if (prefix === 24) return "Campeche";
    if (prefix >= 29 && prefix <= 30) return "Chiapas";
    if (prefix >= 31 && prefix <= 33) return "Chihuahua";
    if (prefix >= 34 && prefix <= 35) return "Durango";
    if (prefix >= 36 && prefix <= 38) return "Guanajuato";
    if (prefix >= 39 && prefix <= 41) return "Guerrero";
    if (prefix >= 42 && prefix <= 43) return "Hidalgo";
    if (prefix >= 44 && prefix <= 49) return "Jalisco";
    if (prefix >= 50 && prefix <= 57) return "Estado de México";
    if (prefix >= 58 && prefix <= 61) return "Michoacán";
    if (prefix === 62) return "Morelos";
    if (prefix === 63) return "Nayarit";
    if (prefix >= 64 && prefix <= 67) return "Nuevo León";
    if (prefix >= 68 && prefix <= 71) return "Oaxaca";
    if (prefix >= 72 && prefix <= 75) return "Puebla";
    if (prefix === 76) return "Querétaro";
    if (prefix === 77) return "Quintana Roo";
    if (prefix >= 78 && prefix <= 79) return "San Luis Potosí";
    if (prefix >= 80 && prefix <= 82) return "Sinaloa";
    if (prefix >= 83 && prefix <= 85) return "Sonora";
    if (prefix === 86) return "Tabasco";
    if (prefix >= 87 && prefix <= 89) return "Tamaulipas";
    if (prefix === 90) return "Tlaxcala";
    if (prefix >= 91 && prefix <= 96) return "Veracruz";
    if (prefix === 97) return "Yucatán";
    if (prefix >= 98 && prefix <= 99) return "Zacatecas";
    return "Ciudad de México";
  };

  const fetchShippingRates = async (zipCode) => {
    if (zipCode.length < 5) return;
    
    setIsFetchingRates(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      const res = await fetch(`${API_BASE_URL}/api/shipping-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zipCode, 
          totalItems, 
          shippingInfo: {
            ...shippingInfo,
            estado: shippingInfo.estado || getStateByZipCode(zipCode),
            ciudad: shippingInfo.ciudad || getStateByZipCode(zipCode)
          } 
        })
      });
      const data = await res.json();
      if (data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        setSelectedRate(data.rates[0]);
      } else {
        throw new Error("Sin tarifas válidas recibidas");
      }
    } catch (error) {
      console.log("Error al obtener tarifas:", error.message);
      // Fallback local en caso de error de red
      const mockRates = [
        { id: 'sk_1', carrier: 'Estafeta', service: 'Terrestre', price: 139, time: '3-5 días' },
        { id: 'sk_2', carrier: 'FedEx', service: 'Económico', price: 155, time: '2-4 días' },
        { id: 'sk_3', carrier: 'DHL', service: 'Express', price: 210, time: '1-2 días' }
      ];
      setShippingRates(mockRates);
      setSelectedRate(mockRates[0]);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleCPChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    
    // Actualizamos el CP de inmediato en cualquier tecla
    setShippingInfo(prev => {
      const newInfo = { ...prev, cp: val };
      if (val.length === 5) {
        const resolvedState = getStateByZipCode(val);
        newInfo.estado = prev.estado || resolvedState;
        newInfo.ciudad = prev.ciudad || resolvedState;
      }
      return newInfo;
    });

    if (val.length === 5) {
      fetchShippingRates(val);
    } else {
      setShippingRates([]);
      setSelectedRate(null);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log("Iniciando handlePaymentSuccess...");
    
    // Calculamos los totales aquí mismo para estar seguros
    const currentCartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const currentShippingPrice = selectedRate ? parseFloat(selectedRate.price) : 0;

    const newOrder = {
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleString(),
      items: [...cart],
      shipping: { ...shippingInfo, rate: selectedRate },
      total: currentCartTotal + currentShippingPrice,
      status: 'Pagado'
    };

    try {
      console.log("Enviando a Firebase via Backend...");
      // Usar variable de entorno para la API o localhost por defecto
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_BASE_URL}/api/confirm-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderDetails: newOrder })
      });

      const result = await response.json();

      if (response.ok) {
        alert("¡Pedido registrado en Firebase!");
        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem('uniformespro_orders', JSON.stringify(updatedOrders));
        setCheckoutStep('success');
      } else {
        alert("Error del servidor: " + (result.error || "Desconocido"));
      }
    } catch (error) {
      console.error("Error detallado:", error);
      alert("Error de conexión: " + error.message);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalShippingPrice = selectedRate ? selectedRate.price : 0;

  const handleCheckout = () => {
    setCheckoutStep('shipping');
  };

  if (view === 'admin') {
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-logo">
            <Shield size={24} />
            <span>Panel Control</span>
          </div>
          <nav>
            <button className="active"><LayoutDashboard size={20} /> Dashboard</button>
            <button onClick={() => setView('shop')}><ShoppingBag size={20} /> Ver Tienda</button>
          </nav>
        </aside>
        
        <main className="admin-main">
          <header className="admin-header">
            <h2>Resumen de Ventas</h2>
            <div className="admin-stats">
              <div className="stat-card">
                <span>Ventas Totales</span>
                <strong>${orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</strong>
              </div>
              <div className="stat-card">
                <span>Pedidos</span>
                <strong>{orders.length}</strong>
              </div>
            </div>
          </header>

          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '3rem'}}>No hay pedidos registrados aún.</td></tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td><strong>{order.id}</strong></td>
                      <td>{order.date}</td>
                      <td>
                        <div className="client-info">
                          <span>{order.shipping.nombre}</span>
                          <small>{order.shipping.email}</small>
                        </div>
                      </td>
                      <td>${order.total.toLocaleString()}</td>
                      <td><span className="status-badge paid">{order.status}</span></td>
                      <td><button className="btn-view-order">Ver detalles</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <nav>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="logo">
          UNIFORMES<span>PRO</span>
        </motion.div>
        <ul className="nav-links">
          <li><a href="#home">Inicio</a></li>
          <li><a href="#catalogo">Catálogo</a></li>
          <li><a href="#beneficios">¿Por qué nosotros?</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>
        <div className="nav-actions">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-cart" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
            <span>({cart.reduce((a, b) => a + b.quantity, 0)})</span>
          </motion.button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Viste el Éxito de tus Hijos.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            Uniformes diseñados para resistir el ritmo escolar con elegancia y confort inigualable. Tecnología en telas de alta durabilidad.
          </motion.p>
          <div className="cta-group">
            <a href="#catalogo" className="btn-primary">Explorar Colección</a>
            <a href="#beneficios" className="btn-outline">Saber más</a>
          </div>
        </div>
        <div className="hero-image">
          <motion.img initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }} src="/hero_custom.png" alt="UniformesPro Colección" />
        </div>
      </section>

      <section className="section" id="catalogo">
        <div className="section-title">
          <span className="badge">Colección 2026</span>
          <h2>Lo más buscado</h2>
          <p>Selección de prendas con acabados premium y costuras reforzadas.</p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      </section>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cart-overlay" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="cart-sidebar">
              <div className="cart-header">
                <h3>
                  {checkoutStep === 'cart' && 'Tu Carrito'}
                  {checkoutStep === 'shipping' && 'Datos de Envío'}
                  {checkoutStep === 'payment' && 'Método de Pago'}
                  {checkoutStep === 'success' && '¡Pedido Recibido!'}
                </h3>
                <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }}><X size={24} /></button>
              </div>

              <div className="cart-content">
                {checkoutStep === 'cart' && (
                  <div className="cart-items">
                    {cart.length === 0 ? (
                      <div className="empty-cart">
                        <ShoppingBag size={48} />
                        <p>Tu carrito está vacío</p>
                        <button className="btn-primary" onClick={() => setIsCartOpen(false)}>Ir a comprar</button>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div className="cart-item" key={item.cartItemId}>
                          <img src={item.currentImg} alt={item.name} />
                          <div className="item-details">
                            <h4>{item.name}</h4>
                            <div className="item-meta">
                              <span className="item-size">Talla: {item.size}</span>
                              <span className="item-price-unit">${item.price.toLocaleString()}</span>
                            </div>
                            <div className="qty-controls">
                              <button onClick={() => updateQuantity(item.cartItemId, -1)}><Minus size={14} /></button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartItemId, 1)}><Plus size={14} /></button>
                            </div>
                          </div>
                          <button className="btn-remove" onClick={() => removeFromCart(item.cartItemId)}><X size={18} /></button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {checkoutStep === 'shipping' && (
                  <div className="checkout-form">
                    <input type="text" placeholder="Nombre completo" value={shippingInfo.nombre} onChange={e => setShippingInfo({...shippingInfo, nombre: e.target.value})} />
                    <input type="email" placeholder="Correo electrónico" value={shippingInfo.email} onChange={e => setShippingInfo({...shippingInfo, email: e.target.value})} />
                    <input type="tel" placeholder="Teléfono" value={shippingInfo.telefono} onChange={e => setShippingInfo({...shippingInfo, telefono: e.target.value})} />
                    <input type="text" placeholder="Dirección completa" value={shippingInfo.direccion} onChange={e => setShippingInfo({...shippingInfo, direccion: e.target.value})} />
                    <div className="form-row">
                      <input type="text" placeholder="Ciudad" value={shippingInfo.ciudad} onChange={e => setShippingInfo({...shippingInfo, ciudad: e.target.value})} />
                      <input type="text" placeholder="CP" value={shippingInfo.cp} onChange={handleCPChange} />
                    </div>
                    <input type="text" placeholder="Estado" value={shippingInfo.estado} onChange={e => setShippingInfo({...shippingInfo, estado: e.target.value})} />
                    
                    <div className="shipping-methods">
                      <h4>Opciones de Envío (Skydropx)</h4>
                      {isFetchingRates ? (
                        <div className="loading-rates">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="spinner">⏳</motion.div>
                          <span>Calculando tarifas con paqueterías...</span>
                        </div>
                      ) : shippingRates.length > 0 ? (
                        shippingRates.map(rate => (
                          <label key={rate.id} className={`shipping-option ${selectedRate?.id === rate.id ? 'active' : ''}`}>
                            <input type="radio" name="shipping" checked={selectedRate?.id === rate.id} onChange={() => setSelectedRate(rate)} />
                            <div className="shipping-info">
                              <span>{rate.carrier} - {rate.service}</span>
                              <small>Llega en {rate.time}</small>
                            </div>
                            <span className="shipping-price">${rate.price} MXN</span>
                          </label>
                        ))
                      ) : (
                        <p className="cp-prompt">Ingresa tu CP para ver opciones de envío</p>
                      )}
                    </div>
                  </div>
                )}

                {checkoutStep === 'payment' && (
                  <div className="payment-view">
                    {clientSecret ? (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                          onPaymentSuccess={handlePaymentSuccess} 
                          cartTotal={cartTotal} 
                          finalShippingPrice={finalShippingPrice} 
                        />
                      </Elements>
                    ) : (
                      <div className="loading-payment">
                        <p>Cargando pasarela de pago...</p>
                      </div>
                    )}
                  </div>
                )}


                {checkoutStep === 'success' && (
                  <div className="success-view">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="success-icon">✅</motion.div>
                    <h3>¡Pedido Confirmado!</h3>
                    <p>Gracias por tu compra en <strong>UniformesPro.mx</strong>.</p>
                    <p>Hemos enviado un correo a <strong>{shippingInfo.email}</strong> con los detalles de tu guía de seguimiento.</p>
                    <button className="btn-primary" onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); setCart([]); }}>Regresar al Inicio</button>
                  </div>
                )}
              </div>

              {cart.length > 0 && checkoutStep !== 'success' && (
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Subtotal</span>
                    <span>${cartTotal.toLocaleString()} MXN</span>
                  </div>
                  {checkoutStep !== 'cart' && (
                    <div className="cart-total">
                      <span>Envío ({selectedRate?.carrier || '--'})</span>
                      <span>${finalShippingPrice} MXN</span>
                    </div>
                  )}
                  <div className="cart-total grand-total">
                    <span>Total a Pagar</span>
                    <span>${(cartTotal + finalShippingPrice).toLocaleString()} MXN</span>
                  </div>
                  
                  {checkoutStep === 'cart' && (
                    <button className="btn-checkout" onClick={() => setCheckoutStep('shipping')}>Continuar al Envío <ChevronRight size={20} /></button>
                  )}
                  {checkoutStep === 'shipping' && (
                    <button 
                      className="btn-checkout" 
                      onClick={handleGoToPayment}
                      disabled={isFetchingSecret || !selectedRate}
                    >
                      {isFetchingSecret ? 'Cargando...' : 'Ir al Pago Seguro'} <ChevronRight size={20} />
                    </button>
                  )}

                  
                  {checkoutStep !== 'cart' && (
                    <button className="btn-back" onClick={() => setCheckoutStep(checkoutStep === 'shipping' ? 'cart' : 'shipping')}>Atrás</button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo" style={{ color: 'white' }}>UNIFORMES<span>PRO</span></div>
            <p>La mejor calidad en uniformes escolares de México. Tradición y tecnología en cada costura.</p>
          </div>
          <div className="footer-links">
            <h4>Secciones</h4>
            <a href="#home">Inicio</a><a href="#catalogo">Catálogo</a><a href="#contacto">Contacto</a>
          </div>
          <div className="footer-social">
            <h4>Síguenos</h4>
            <div className="social-icons"><span>FB</span> <span>IG</span> <span>TW</span></div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} UniformesPro.mx - Todos los derechos reservados.</p>
          <button className="admin-login-link" onClick={() => setView('admin')}>Acceso Administrador</button>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a 
        href="https://wa.me/521234567890?text=Hola!%20Me%20interesa%20comprar%20uniformes." 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="whatsapp-pulse"></div>
        <MessageCircle size={32} />
      </motion.a>
    </div>
  );
}

export default App;
