import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, ShoppingBag, ChevronRight, Star, MessageCircle, Ruler, Shield, LayoutDashboard, CheckCircle, AlertCircle, RotateCw, LogOut, TrendingUp, DollarSign, Lock, Mail, Eye, EyeOff, FileText } from 'lucide-react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_PonAquiTuClavePublicaDeStripe');

const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'))
  ? 'https://uniformespro-backend.onrender.com'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

// Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';
const db = getFirestore(firebaseApp, databaseId);



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

const AdminLogin = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Por favor intenta de nuevo.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
        setError('Ocurrió un error al iniciar sesión. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="login-header">
          <div className="stat-icon" style={{background: '#EAB308', color: '#0F172A', width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 1rem'}}>
            <Shield size={24} />
          </div>
          <h2>Acceso Administrador</h2>
          <p>Ingresa tus credenciales para gestionar la tienda</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label><Mail size={16} /> Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="admin@uniformespro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label><Lock size={16} /> Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <RotateCw className="spinner" size={20} /> : 'Iniciar Sesión'}
          </button>

          <button type="button" className="btn-back" onClick={onBack}>
            Regresar a la Tienda
          </button>
        </form>
      </motion.div>
    </div>
  );
};

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState(productsData);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'shipping', 'payment', 'success'
  const [view, setView] = useState(() => localStorage.getItem('uniformespro_view') || 'shop'); 
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('uniformespro_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
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
  const [validationError, setValidationError] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('shop');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const validateShipping = () => {
    setValidationError('');
    const { nombre, email, telefono, direccion, ciudad, cp, estado } = shippingInfo;
    if (!nombre || !email || !telefono || !direccion || !ciudad || !cp || !estado) {
      setValidationError("Completa todos los campos de envío.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Correo electrónico no válido.");
      return false;
    }
    if (telefono.length < 10) {
      setValidationError("El teléfono debe tener 10 dígitos.");
      return false;
    }
    if (!selectedRate) {
      setValidationError("Selecciona un método de envío.");
      return false;
    }
    return true;
  };

  const handleShippingChange = (field, value) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    if (validationError) setValidationError('');
  };

  const handleGoToPayment = async () => {
    if (cart.length === 0) return;
    if (!validateShipping()) return;
    
    setIsFetchingSecret(true);
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
      setValidationError('Error de red al conectar con el servidor. Verifica que el servidor esté encendido.');
    } finally {
      setIsFetchingSecret(false);
    }
  };


  const fetchOrders = async () => {
    setIsFetchingOrders(true);
    try {
      // Consulta directa a Firestore (segura porque el usuario ya está autenticado)
      const q = query(collection(db, "pedidos"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Raw orders from Firestore:", ordersData);
      
      // Normalizar fechas de Firebase (maneja Timestamps, strings y fallbacks)
      const normalized = ordersData.map(o => {
        let ts = Date.now();
        if (o.createdAt) {
          if (o.createdAt.seconds !== undefined) ts = o.createdAt.seconds * 1000;
          else if (o.createdAt._seconds !== undefined) ts = o.createdAt._seconds * 1000;
          else if (typeof o.createdAt === 'number') ts = o.createdAt;
          else if (typeof o.createdAt === 'string') {
            const parsed = new Date(o.createdAt).getTime();
            if (!isNaN(parsed)) ts = parsed;
          }
        }
        return { ...o, createdAt: ts };
      });

      // Ya vienen ordenados por la query, pero reforzamos por si acaso
      normalized.sort((a, b) => b.createdAt - a.createdAt);

      setOrders(normalized);
      setFilteredOrders(normalized);
      console.log("Sincronización directa exitosa:", normalized.length, "pedidos.");
    } catch (err) {
      console.error("Error fetching orders from Firestore:", err);
      if (err.code === 'permission-denied') {
        alert("Error de permisos: No puedes ver los pedidos. Verifica las reglas de Firestore.");
      }

      // Mantener los pedidos previos de localStorage si la red falla
    } finally {
      setIsFetchingOrders(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('uniformespro_view', view);
    if (view === 'admin' && adminUser) {
      fetchOrders();
    }
  }, [view, adminUser]);

  // Persistir pedidos cuando cambien
  useEffect(() => {
    localStorage.setItem('uniformespro_orders', JSON.stringify(orders));
  }, [orders]);

  // Filtro de fecha en tiempo real
  useEffect(() => {
    if (dateFilter.start || dateFilter.end) {
      const start = dateFilter.start ? new Date(dateFilter.start).getTime() : 0;
      const end = dateFilter.end ? new Date(dateFilter.end).getTime() + 86400000 : Infinity; // +1 día para incluir el final
      
      const filtered = orders.filter(o => {
        const orderTime = new Date(o.createdAt).getTime();
        return orderTime >= start && orderTime <= end;
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [dateFilter, orders]);

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert("No hay pedidos para exportar con los filtros actuales.");
      return;
    }

    try {
      const exportData = filteredOrders.map(o => ({
        ID: o.id?.toUpperCase() || 'N/A',
        Fecha: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A',
        Cliente: o.shipping?.nombre || 'N/A',
        Email: o.shipping?.email || 'N/A',
        Telefono: o.shipping?.telefono || 'N/A',
        Ciudad: o.shipping?.ciudad || 'N/A',
        Estado: o.shipping?.estado || 'N/A',
        Items: o.items?.map(i => `${i.name} (Talla: ${i.size}, Cant: ${i.quantity})`).join(' | ') || 'N/A',
        Carrier: o.shipping?.rate?.carrier || 'N/A',
        Servicio: o.shipping?.rate?.service || 'N/A',
        Subtotal: (o.total - (o.shipping?.rate?.price || 0)).toFixed(2),
        Envio: (o.shipping?.rate?.price || 0).toFixed(2),
        Total: (o.total || 0).toFixed(2)
      }));

      const csv = Papa.unparse(exportData);
      
      // Use standard CSV MIME type and UTF-8 BOM
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `pedidos_uniformespro_${timestamp}.csv`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      link.style.position = 'absolute';
      
      // Explicitly add to DOM before clicking
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a longer delay to ensure the browser has handled the request
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      alert("Hubo un problema al generar el reporte. Por favor intenta de nuevo.");
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

  // Manejar el regreso de Stripe después de un redireccionamiento (ej. 3D Secure)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentIntentId = query.get("payment_intent");
    const status = query.get("redirect_status");

    if (paymentIntentId && status === "succeeded") {
      // Si venimos de un pago exitoso que requirió redirección
      setCheckoutStep('success');
      setIsCartOpen(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#0F172A', '#22C55E']
      });
      // Limpiar URL
      window.history.replaceState({}, document.title, "/");
    }
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

  // Recalcular envío automáticamente cuando cambie la cantidad de artículos
  useEffect(() => {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (shippingInfo.cp && shippingInfo.cp.length === 5 && totalQty > 0) {
      console.log("Recalculando envío por cambio en carrito...");
      fetchShippingRates(shippingInfo.cp);
    }
  }, [cart.map(item => item.quantity).join(',')]); // Se activa cuando cambian las cantidades

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
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      
      const performFetch = async () => {
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
        return await res.json();
      };

      let data = await performFetch();
      
      // Si el backend falló (devolvió el fallback), intentamos UNA vez más desde el frontend
      // dándole otros 3 segundos de margen.
      if (!data.success) {
        console.log("Backend devolvió fallback, reintentando desde frontend en 3s...");
        await new Promise(r => setTimeout(r, 3000));
        data = await performFetch();
      }

      if (data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        setSelectedRate(data.rates[0]);
      } else {
        throw new Error("Sin tarifas válidas recibidas");
      }
    } catch (error) {
      console.log("Error al obtener tarifas:", error.message);
      // Solo mostramos el fallback manual si tras todos los reintentos (backend + frontend) seguimos sin nada real
      const mockRates = [
        { id: 'def_1', carrier: 'Estafeta', service: 'Terrestre (Default)', price: 145, time: '3-5 días' },
        { id: 'def_2', carrier: 'FedEx', service: 'Económico (Default)', price: 160, time: '2-4 días' },
        { id: 'def_3', carrier: 'DHL', service: 'Express (Default)', price: 220, time: '1-2 días' }
      ];
      setShippingRates(mockRates);
      setSelectedRate(mockRates[0]);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleCPChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    
    setShippingInfo(prev => {
      const newInfo = { ...prev, cp: val };
      if (val.length === 5) {
        const resolvedState = getStateByZipCode(val);
        // Si tiene 5 dígitos, actualizamos ciudad y estado
        newInfo.estado = resolvedState;
        newInfo.ciudad = resolvedState;
      } else {
        // Si borra o está incompleto, limpiamos para evitar errores
        newInfo.estado = '';
        newInfo.ciudad = '';
      }
      return newInfo;
    });

    if (val.length === 5) {
      fetchShippingRates(val);
    } else {
      // Reiniciar cotización si se borra el CP
      setShippingRates([]);
      setSelectedRate(null);
    }
    if (validationError) setValidationError('');
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
      
      const response = await fetch(`${API_BASE_URL}/api/confirm-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderDetails: newOrder })
      });

      const result = await response.json();

      if (response.ok) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#0F172A', '#22C55E']
        });
        
        // Creamos una copia para el estado local con formato consistente
        const localOrder = { ...newOrder, createdAt: Date.now(), id: result.id || newOrder.id };
        const updatedOrders = [localOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem('uniformespro_orders', JSON.stringify(updatedOrders));
        setCheckoutStep('success');
        setCart([]); // Limpiar carrito
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

  if (view === 'privacy') {
    return (
      <div className="privacy-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="main-header" style={{ position: 'relative', background: '#0F172A', padding: '1rem 5%' }}>
          <div className="logo" onClick={() => setView('shop')} style={{ cursor: 'pointer', color: 'white' }}>
            UNIFORMES<span>PRO</span>
          </div>
          <nav className="desktop-nav">
            <button className="btn-back" onClick={() => setView('shop')} style={{ color: 'white', border: '1px solid white' }}>Regresar a la tienda</button>
          </nav>
        </header>
        
        <main className="privacy-container" style={{ padding: '4rem 5%', maxWidth: '800px', margin: '0 auto', color: '#334155', flex: 1 }}>
          <h1 style={{ color: '#0F172A', marginBottom: '2rem', fontSize: '2.5rem' }}>Aviso de Privacidad</h1>
          
          <div className="privacy-content" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
            <p><strong>Última actualización:</strong> {new Date().toLocaleDateString()}</p>
            
            <h2 style={{ marginTop: '2rem', color: '#1E293B', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Identidad y domicilio del responsable</h2>
            <p>UniformesPro, con domicilio en México, es responsable del uso y protección de sus datos personales, y al respecto le informamos lo siguiente:</p>
            
            <h2 style={{ marginTop: '2rem', color: '#1E293B', fontSize: '1.5rem', marginBottom: '1rem' }}>2. ¿Para qué fines utilizaremos sus datos personales?</h2>
            <p>Los datos personales que recabamos de usted, los utilizaremos para las siguientes finalidades que son necesarias para el servicio que solicita:</p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Procesamiento y envío de pedidos y productos adquiridos.</li>
              <li>Facturación y cobro de nuestros productos.</li>
              <li>Atención a clientes, aclaraciones y devoluciones.</li>
            </ul>

            <h2 style={{ marginTop: '2rem', color: '#1E293B', fontSize: '1.5rem', marginBottom: '1rem' }}>3. ¿Qué datos personales recabamos?</h2>
            <p>Para llevar a cabo las finalidades descritas en el presente aviso de privacidad, utilizaremos los siguientes datos personales:</p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Nombre completo.</li>
              <li>Teléfono de contacto.</li>
              <li>Correo electrónico.</li>
              <li>Dirección de envío (Calle, Colonia, Ciudad, Estado, Código Postal).</li>
            </ul>

            <h2 style={{ marginTop: '2rem', color: '#1E293B', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Transferencia de datos</h2>
            <p>Le informamos que sus datos personales son compartidos únicamente con proveedores de servicios logísticos y de paquetería exclusivamente con el propósito de realizar el envío y entrega de sus pedidos.</p>

            <h2 style={{ marginTop: '2rem', color: '#1E293B', fontSize: '1.5rem', marginBottom: '1rem' }}>5. Pasarelas de Pago</h2>
            <p>El procesamiento de los pagos se realiza a través de plataformas de pago seguras de terceros (como Stripe). Nosotros no almacenamos ni procesamos información de tarjetas de crédito o débito en nuestros servidores.</p>

            <h2 style={{ marginTop: '2rem', color: '#1E293B', fontSize: '1.5rem', marginBottom: '1rem' }}>6. ¿Cómo puede contactarnos?</h2>
            <p>Si usted tiene alguna duda sobre el presente aviso de privacidad, puede contactarnos en nuestras redes sociales o medios de atención al cliente.</p>
          </div>
        </main>
        
        <footer className="main-footer" style={{ marginTop: 'auto' }}>
          <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p>&copy; {new Date().getFullYear()} UniformesPro.mx - Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  if (view === 'admin') {
    if (isAuthChecking) return <div className="loading-screen" style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><RotateCw className="spinner" /></div>;
    if (!adminUser) return <AdminLogin onLoginSuccess={() => fetchOrders()} onBack={() => setView('shop')} />;

    const totalSales = filteredOrders.reduce((acc, o) => acc + o.total, 0);
    const avgTicket = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;

    return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-logo">
            <div className="stat-icon" style={{background: '#EAB308', color: '#0F172A', width: '40px', height: '40px', borderRadius: '10px'}}>
              <Shield size={20} />
            </div>
            <div className="logo" style={{ fontSize: '1.2rem', color: 'white' }}>UNIFORMES<span style={{color: '#EAB308'}}>PRO</span></div>
          </div>
          <nav>
            <button className="active"><LayoutDashboard size={20} /> Dashboard</button>
            <button onClick={() => setView('shop')}><ShoppingBag size={20} /> Ver Tienda</button>
          </nav>
          <div className="sidebar-footer">
            <button className="admin-login-link" style={{color: '#94A3B8', padding: 0, marginTop: 0}} onClick={handleLogout}>
              <LogOut size={16} style={{marginRight: '8px'}} /> Cerrar Sesión
            </button>
            <p style={{marginTop: '1rem', opacity: 0.5}}>Admin Panel v2.0</p>
          </div>
        </aside>
        
        <main className="admin-main">
          <header className="admin-header">
            <div className="header-top">
              <div>
                <h2>Panel de Control</h2>
                <p style={{color: '#64748B', fontWeight: 500}}>Gestiona tus ventas y pedidos en tiempo real</p>
              </div>
              <div style={{display: 'flex', gap: '0.8rem'}}>
                <button className="btn-refresh" onClick={handleExportExcel} style={{background: '#0F172A', color: 'white', border: '1px solid #1E293B'}}>
                  <FileText size={18} /> Exportar Excel
                </button>
                <button className="btn-refresh" onClick={fetchOrders} disabled={isFetchingOrders} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <motion.div animate={isFetchingOrders ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RotateCw size={18} />
                  </motion.div>
                  {isFetchingOrders ? 'Sincronizando...' : 'Actualizar Datos'}
                </button>
              </div>
            </div>
            
            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-icon yellow"><TrendingUp size={28} /></div>
                <div className="stat-info">
                  <h5>Ventas (Filtrado)</h5>
                  <strong>${totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><CheckCircle size={28} /></div>
                <div className="stat-info">
                  <h5>Pedidos Totales</h5>
                  <strong>{filteredOrders.length}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><DollarSign size={28} /></div>
                <div className="stat-info">
                  <h5>Ticket Promedio</h5>
                  <strong>${avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>
          </header>

          <div className="orders-table-container">
            <div className="table-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '1rem'}}>
              <div style={{display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3>Ventas Recientes</h3>
                <span className="badge" style={{background: '#F1F5F9', color: '#475569'}}>{filteredOrders.length} transacciones</span>
              </div>
              
              <div className="admin-filters">
                <div className="filter-group">
                  <label>Desde:</label>
                  <input 
                    type="date" 
                    value={dateFilter.start} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="filter-group">
                  <label>Hasta:</label>
                  <input 
                    type="date" 
                    value={dateFilter.end} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                {(dateFilter.start || dateFilter.end) && (
                  <button className="btn-clear-filters" onClick={() => setDateFilter({ start: '', end: '' })}>
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingOrders ? (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '8rem 0'}}>
                      <div className="loading-state">
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          style={{ display: 'inline-block', marginBottom: '1rem' }}
                        >
                          <RotateCw size={48} color="#EAB308" />
                        </motion.div>
                        <p style={{color: '#64748B', fontWeight: 500}}>Sincronizando con la base de datos...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '8rem 0'}}>
                      <div className="empty-state" style={{opacity: 0.6}}>
                        <ShoppingBag size={64} style={{marginBottom: '1.5rem', color: '#CBD5E1'}} />
                        <h4 style={{fontSize: '1.2rem', marginBottom: '0.5rem', color: '#475569'}}>No se encontraron pedidos</h4>
                        <p style={{color: '#94A3B8'}}>Intenta cambiar el rango de fechas o sincroniza nuevamente.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="order-row">
                      <td><span className="order-id-tag">#{order.id.slice(-8).toUpperCase()}</span></td>
                      <td>
                        <div style={{fontSize: '0.9rem'}}>
                          <div style={{fontWeight: 600}}>{new Date(order.createdAt).toLocaleDateString()}</div>
                          <div style={{color: '#94A3B8', fontSize: '0.8rem'}}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      </td>
                      <td>
                        <div className="client-info">
                          <strong>{order.shipping.nombre}</strong>
                          <small>{order.shipping.email}</small>
                          <small style={{display: 'block', color: '#94A3B8', marginTop: '2px'}}>{order.shipping.telefono}</small>
                        </div>
                      </td>
                      <td>
                        <div className="location-info">
                          <span>{order.shipping.ciudad}</span>
                          <small>{order.shipping.estado}</small>
                        </div>
                      </td>
                      <td><span className="order-total-cell">${order.total.toLocaleString()}</span></td>
                      <td><span className="status-badge paid">Pagado</span></td>
                      <td>
                        <button className="btn-action-view" onClick={() => setSelectedOrder(order)}>
                          Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Order Detail Panel */}
        <AnimatePresence>
          {selectedOrder && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedOrder(null)} />
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="order-detail-panel"
              >
                <div className="panel-header">
                  <h3>Resumen de Pedido</h3>
                  <button className="btn-close-panel" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
                </div>
                
                <div className="panel-content">
                  <div className="order-header-info">
                    <span className="order-id-large">#{selectedOrder.id.toUpperCase()}</span>
                    <span className="order-date-large">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="panel-section">
                    <h4><ShoppingCart size={18} /> Productos Comprados</h4>
                    <div className="items-list">
                      {selectedOrder.items && selectedOrder.items.map((item, i) => (
                        <div key={i} className="panel-item">
                          <img src={item.currentImg || '/placeholder.png'} alt={item.name} />
                          <div className="item-txt">
                            <h5>{item.name}</h5>
                            <p style={{fontSize: '0.85rem', color: '#64748B'}}>Talla: <span style={{fontWeight: 700}}>{item.size}</span> | Cantidad: <span style={{fontWeight: 700}}>{item.quantity}</span></p>
                            <strong style={{color: '#0F172A'}}>${(item.price * item.quantity).toLocaleString()}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel-section">
                    <h4><Shield size={18} /> Información de Envío</h4>
                    <div className="shipping-details-box">
                      <p><strong>Destinatario:</strong> {selectedOrder.shipping.nombre}</p>
                      <p><strong>Contacto:</strong> {selectedOrder.shipping.telefono} | {selectedOrder.shipping.email}</p>
                      <p><strong>Dirección:</strong> {selectedOrder.shipping.direccion}</p>
                      <p><strong>Destino:</strong> {selectedOrder.shipping.ciudad}, {selectedOrder.shipping.estado}, CP {selectedOrder.shipping.cp}</p>
                    </div>
                  </div>

                  <div className="panel-section">
                    <h4><ChevronRight size={18} /> Logística (Skydropx)</h4>
                    <div className="carrier-box">
                      <div className="carrier-info">
                        <strong style={{fontSize: '1.1rem', color: '#0F172A'}}>{selectedOrder.shipping.rate.carrier.toUpperCase()}</strong>
                        <div style={{color: '#64748B', fontSize: '0.85rem'}}>{selectedOrder.shipping.rate.service}</div>
                      </div>
                      <div className="carrier-price">
                        ${selectedOrder.shipping.rate.price.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="panel-summary">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.total - selectedOrder.shipping.rate.price).toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Envío</span>
                      <span>${selectedOrder.shipping.rate.price.toLocaleString()}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total Pagado</span>
                      <span>${selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="main-nav">
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

      <section className="section beneficios-section" id="beneficios" style={{ background: '#F8FAFC', padding: '6rem 5%' }}>
        <div className="section-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600 }}>Nuestra Promesa</span>
          <h2 style={{ fontSize: '2.5rem', color: '#0F172A', marginTop: '1rem', marginBottom: '1rem', fontWeight: 800 }}>¿Por qué nosotros?</h2>
          <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Más que uniformes, creamos prendas diseñadas para el rendimiento, confort y durabilidad que los estudiantes necesitan en su día a día.
          </p>
        </div>
        
        <div className="beneficios-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { icon: '⭐', title: 'Calidad Superior', desc: 'Utilizamos telas de última generación resistentes al desgaste, al lavado frecuente y que mantienen su color por más tiempo.' },
            { icon: '🛡️', title: 'Garantía de Confección', desc: 'Costuras reforzadas y terminados de alta precisión para soportar el dinamismo diario de los estudiantes sin perder la forma.' },
            { icon: '🚚', title: 'Envíos Rápidos y Seguros', desc: 'Llegamos a cualquier parte de México con tarifas competitivas y tiempos de entrega garantizados a través de las mejores paqueterías.' },
            { icon: '🧵', title: 'Diseño Ergonómico', desc: 'Patrones actualizados que permiten total libertad de movimiento, brindando el máximo confort durante toda la jornada escolar.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ background: 'white', padding: '2.5rem 2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            >
              <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: '#F1F5F9', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '1rem', fontWeight: 700 }}>{item.title}</h3>
              <p style={{ color: '#64748B', lineHeight: '1.6', fontSize: '0.95rem' }}>{item.desc}</p>
            </motion.div>
          ))}
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
                    <input type="text" placeholder="Nombre completo" value={shippingInfo.nombre} onChange={e => handleShippingChange('nombre', e.target.value)} />
                    <input type="email" placeholder="Correo electrónico" value={shippingInfo.email} onChange={e => handleShippingChange('email', e.target.value)} />
                    <input type="tel" placeholder="Teléfono" value={shippingInfo.telefono} onChange={e => handleShippingChange('telefono', e.target.value)} />
                    <input type="text" placeholder="Dirección completa" value={shippingInfo.direccion} onChange={e => handleShippingChange('direccion', e.target.value)} />
                    <div className="form-row">
                      <input type="text" placeholder="Ciudad" value={shippingInfo.ciudad} onChange={e => handleShippingChange('ciudad', e.target.value)} />
                      <input type="text" placeholder="CP" value={shippingInfo.cp} onChange={handleCPChange} />
                    </div>
                    <input type="text" placeholder="Estado" value={shippingInfo.estado} onChange={e => handleShippingChange('estado', e.target.value)} />
                    
                    <div className="shipping-methods">
                      <h4>Opciones de Envío (Skydropx)</h4>
                      <div className="shipping-methods-grid">
                        {isFetchingRates ? (
                          <div className="loading-rates-indicator">
                            <div className="loader-spinner"></div>
                            <p>Cotizando las mejores tarifas...</p>
                          </div>
                        ) : shippingRates.length > 0 ? (
                          shippingRates.map(rate => (
                            <motion.div 
                              key={rate.id}
                              whileHover={{ y: -2 }}
                              className={`shipping-method-card ${selectedRate?.id === rate.id ? 'active' : ''}`}
                              onClick={() => setSelectedRate(rate)}
                            >
                              <div className="carrier-info">
                                <strong>{rate.carrier}</strong>
                                <span>{rate.service}</span>
                              </div>
                              <div className="price-info">
                                <span className="shipping-price">${rate.price.toLocaleString()} MXN</span>
                                <span className="shipping-time">{rate.time}</span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="no-rates-msg">Ingresa un Código Postal válido para cotizar.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'payment' && (
                  <div className="payment-view">
                    {clientSecret ? (
                      <Elements 
                        stripe={stripePromise} 
                        options={{ 
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#0F172A',
                              colorBackground: '#ffffff',
                              colorText: '#0F172A',
                              colorDanger: '#ef4444',
                              fontFamily: 'Outfit, system-ui, sans-serif',
                              spacingUnit: '4px',
                              borderRadius: '12px',
                              colorIcon: '#0F172A',
                            },
                            rules: {
                              '.Label': {
                                color: '#0F172A',
                                fontWeight: '600',
                                marginBottom: '8px',
                              },
                              '.Input': {
                                border: '1px solid #E2E8F0',
                                boxShadow: 'none',
                              },
                              '.Input:focus': {
                                border: '1px solid #EAB308',
                                boxShadow: '0 0 0 3px rgba(234, 179, 8, 0.1)',
                              }
                            }
                          }
                        }}
                      >
                        <CheckoutForm 
                          onPaymentSuccess={handlePaymentSuccess} 
                          cartTotal={cartTotal} 
                          finalShippingPrice={finalShippingPrice} 
                        />
                      </Elements>
                    ) : (
                      <div className="loading-payment">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="spinner">⏳</motion.div>
                        <p>Iniciando pasarela de pago segura...</p>
                      </div>
                    )}
                  </div>
                )}


                {checkoutStep === 'success' && (
                  <div className="success-view">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      className="success-icon-wrapper"
                    >
                      <CheckCircle size={80} strokeWidth={1.5} />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3>¡Pago Exitoso!</h3>
                      <p className="success-p">Gracias por tu confianza en <strong>UniformesPro</strong>.</p>
                      
                      <div className="success-details-card">
                        <div className="detail-row">
                          <span>Correo:</span>
                          <strong>{shippingInfo.email}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Envío:</span>
                          <strong>{selectedRate?.carrier} ({selectedRate?.time})</strong>
                        </div>
                      </div>

                      <p className="success-notice">Recibirás un correo con tu número de guía en breve.</p>
                      
                      <button 
                        className="btn-checkout btn-success-back" 
                        onClick={() => { 
                          setIsCartOpen(false); 
                          setCheckoutStep('cart'); 
                          setCart([]); 
                        }}
                      >
                        Seguir Comprando
                      </button>
                    </motion.div>
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
                  <p className="shipping-notice-small">
                    IVA incluido. Los tiempos de entrega son estimados por la paquetería.
                  </p>

                  <AnimatePresence>
                    {validationError && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="validation-error-banner"
                      >
                        <AlertCircle size={16} /> 
                        <span>{validationError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
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
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button className="admin-login-link" onClick={() => setView('privacy')}>Aviso de Privacidad</button>
            <button className="admin-login-link" onClick={() => setView('admin')}>Acceso Administrador</button>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a 
        href="https://wa.me/523316997723?text=Hola!%20Me%20gustaría%20más%20información%20sobre%20los%20uniformes." 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Contactar por WhatsApp"
      >
        <div className="whatsapp-pulse"></div>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
          alt="WhatsApp"
          width="36"
          height="36"
          style={{ position: 'relative', zIndex: 2 }}
        />
      </motion.a>
    </div>
  );
}

export default App;
