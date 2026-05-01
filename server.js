import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Limpiar variables de entorno de posibles comillas
const CLIENT_ID = (process.env.SKYDROPX_CLIENT_ID || "").trim().replace(/^"|"$/g, '');
const CLIENT_SECRET = (process.env.SKYDROPX_CLIENT_SECRET || "").trim().replace(/^"|"$/g, '');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://uniformespro.vercel.app',
      'https://uniformespro.vercel.app/'
    ];
    if (!origin || origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
const db = getFirestore(firebaseApp, databaseId);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log("------------------------------------------");
console.log("🔥 FIREBASE PROJECT:", firebaseConfig.projectId);
console.log("📦 FIRESTORE DATABASE:", databaseId);
console.log("------------------------------------------");

// --- UTILIDADES SKYDROPX PRO ---
let cachedToken = null;
let tokenExpiry = 0;

async function getSkydropxToken() {
  if (cachedToken && Date.now() < (tokenExpiry - 60000)) {
    return cachedToken;
  }

  try {
    console.log("Intentando obtener nuevo token de Skydropx PRO...");
    console.log(`Usando CLIENT_ID: ${CLIENT_ID}`);
    // Log seguro del secret
    console.log(`CLIENT_SECRET empieza con: ${CLIENT_SECRET.substring(0, 4)}...`);

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    // Probamos con la URL estándar de PRO v1 (según docs)
    const response = await fetch('https://api-pro.skydropx.com/api/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });

    console.log(`Respuesta OAuth Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en respuesta OAuth:", errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    console.log("✅ Nuevo token Skydropx PRO generado correctamente.");
    return cachedToken;
  } catch (error) {
    console.error("❌ Error crítico obteniendo token Skydropx:", error.message);
    return null;
  }
}

function getStateByZipCode(cp) {
  const zip = parseInt(cp);
  if (zip >= 1000 && zip <= 19999) return "Ciudad de México";
  if (zip >= 20000 && zip <= 29999) return "Aguascalientes";
  if (zip >= 30000 && zip <= 33999) return "Chihuahua";
  if (zip >= 34000 && zip <= 38999) return "Durango";
  if (zip >= 39000 && zip <= 41999) return "Guerrero";
  if (zip >= 42000 && zip <= 43999) return "Hidalgo";
  if (zip >= 44000 && zip <= 49999) return "Jalisco";
  if (zip >= 50000 && zip <= 57999) return "Estado de México";
  if (zip >= 58000 && zip <= 61999) return "Michoacán";
  if (zip >= 62000 && zip <= 62999) return "Morelos";
  if (zip >= 63000 && zip <= 63999) return "Nayarit";
  if (zip >= 64000 && zip <= 67999) return "Nuevo León";
  if (zip >= 68000 && zip <= 71999) return "Oaxaca";
  if (zip >= 72000 && zip <= 75999) return "Puebla";
  if (zip >= 76000 && zip <= 76999) return "Querétaro";
  if (zip >= 77000 && zip <= 77999) return "Quintana Roo";
  if (zip >= 78000 && zip <= 79999) return "San Luis Potosí";
  if (zip >= 80000 && zip <= 82999) return "Sinaloa";
  if (zip >= 83000 && zip <= 85999) return "Sonora";
  if (zip >= 86000 && zip <= 86999) return "Tabasco";
  if (zip >= 87000 && zip <= 89999) return "Tamaulipas";
  if (zip >= 90000 && zip <= 90999) return "Tlaxcala";
  if (zip >= 91000 && zip <= 96999) return "Veracruz";
  if (zip >= 97000 && zip <= 97999) return "Yucatán";
  if (zip >= 98000 && zip <= 99999) return "Zacatecas";
  return "Ciudad de México"; // Fallback general
}

// --- ENDPOINTS ---

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { items, shipping } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

    const calculateOrderAmount = (cartItems, shippingInfo) => {
      const csvFilePath = path.resolve(__dirname, 'public', 'productos.csv');
      const csvFile = fs.readFileSync(csvFilePath, 'utf8');
      const results = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
      const dbProducts = results.data.map(row => ({ id: parseInt(row.id), price: parseFloat(row.price) }));
      const subtotal = cartItems.reduce((acc, item) => {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        return acc + ((dbProduct ? dbProduct.price : 0) * item.quantity);
      }, 0);
      const shippingPrice = shippingInfo && shippingInfo.rate ? shippingInfo.rate.price : 0;
      return Math.round((subtotal + shippingPrice) * 100);
    };

    const amount = calculateOrderAmount(items, shipping);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: { order_id: `ORD-${Date.now()}` }
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipping-rates', async (req, res) => {
  const { zipCode, totalItems } = req.body;
  console.log(`\n--- COTIZACIÓN CP: ${zipCode} | Artículos: ${totalItems || 1} ---`);

  try {
    const stateInfo = getStateByZipCode(zipCode);
    const token = await getSkydropxToken();
    if (!token) throw new Error("Token no disponible");

    // Calculamos un peso aproximado (0.5kg por artículo, mínimo 1kg)
    const totalWeight = Math.max(1, (totalItems || 1) * 0.5);

    const fetchRates = async () => {
      const response = await fetch('https://api-pro.skydropx.com/api/v1/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quotation: {
            address_from: { country_code: "MX", postal_code: "45239", area_level1: "Jalisco", area_level2: "Zapopan", area_level3: "Tesistán", address_line1: "Tesistán" },
            address_to: { country_code: "MX", postal_code: zipCode, area_level1: stateInfo, area_level2: stateInfo, area_level3: "Centro", address_line1: "Centro" },
            parcels: [{ length: 15, width: 15, height: 15, weight: totalWeight, package_protected: false, declared_value: 500 }]
          }
        })
      });
      return await response.json();
    };

    let data = await fetchRates();
    
    // Sistema de reintentos más persistente (hasta 3 intentos con pausa de 2s)
    let attempts = 1;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && 
           ((!data.rates || data.rates.length === 0) || 
            (data.rates && data.rates.every(r => !r.success)))) {
      console.log(`⏳ Intento ${attempts}/${maxAttempts} fallido. Reintentando en 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      data = await fetchRates();
      attempts++;
    }

    let rates = [];
    if (data && data.rates) {
      const allowedCarriers = ['dhl', 'fedex', 'estafeta'];
      
      rates = data.rates
        .filter(r => {
          const carrier = (r.provider_name || "").toLowerCase();
          return r.success && 
                 parseFloat(r.total) > 0 && 
                 allowedCarriers.some(c => carrier.includes(c));
        })
        .map(r => ({
          id: r.id,
          carrier: r.provider_display_name || r.provider_name,
          service: r.provider_service_name || "Estándar",
          price: parseFloat(r.total),
          time: r.days ? `${r.days} días` : '3-5 días'
        }))
        .sort((a, b) => a.price - b.price); // Ordenar de menor a mayor
    }

    if (rates.length > 0) {
      console.log(`✅ ${rates.length} tarifas filtradas y ordenadas obtenidas.`);
      return res.json({ success: true, rates });
    }
    
    throw new Error("No se encontraron tarifas para DHL, FedEx o Estafeta en esta zona.");

  } catch (error) {
    console.error("❌ FALLBACK:", error.message);
    res.json({
      success: false,
      message: error.message,
      rates: [
        { id: 'def_1', carrier: 'Estafeta', service: 'Terrestre (Default)', price: 145, time: '3-5 días' },
        { id: 'def_2', carrier: 'FedEx', service: 'Económico (Default)', price: 160, time: '2-4 días' },
        { id: 'def_3', carrier: 'DHL', service: 'Express (Default)', price: 220, time: '1-2 días' }
      ]
    });
  }
});

app.post('/api/create-label', async (req, res) => {
  try {
    const { rate_id } = req.body;
    // Si es una tarifa por defecto/fallback, no podemos generar guía automática
    if (!rate_id || rate_id.startsWith('def_')) {
      return res.json({ success: true, label_url: null, tracking_number: 'MANUAL_PENDING' });
    }

    const token = await getSkydropxToken();
    if (!token) throw new Error("Token Skydropx no disponible");

    // Skydropx PRO: generar la guía a partir del rate_id
    const response = await fetch('https://api-pro.skydropx.com/api/v1/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rate_id })
    });

    const data = await response.json();
    
    if (response.ok && data) {
      // Las respuestas pueden variar, buscamos label_url o document_url y tracking
      const labelUrl = data.label_url || (data.data && data.data.attributes && data.data.attributes.label_url) || null;
      const tracking = data.tracking_number || (data.data && data.data.attributes && data.data.attributes.tracking_number) || 'PROCESANDO';
      
      console.log(`✅ Guía generada exitosamente. Tracking: ${tracking}`);
      return res.json({ 
        success: true, 
        label_url: labelUrl, 
        tracking_number: tracking,
        raw_data: data
      });
    }

    throw new Error(data.message || JSON.stringify(data.errors) || "Error desconocido al generar guía");
  } catch (error) {
    console.error("❌ Error generando guía:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/confirm-order', async (req, res) => {
  try {
    const { orderDetails } = req.body;
    const docRef = await addDoc(collection(db, "pedidos"), { 
      ...orderDetails, 
      createdAt: serverTimestamp() 
    });
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// El endpoint /api/orders ha sido movido al frontend (App.jsx) por seguridad, 
// para aprovechar Firebase Auth y las reglas de seguridad de Firestore.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
