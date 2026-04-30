import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Habilitar CORS para que el frontend pueda hablar con el servidor
app.use(cors({
  origin: function (origin, callback) {
    // Permitir cualquier puerto local o sin origin (como requests directos)
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
// Usar el ID de base de datos del .env (importante si no es "(default)")
const db = getFirestore(firebaseApp, process.env.FIREBASE_DATABASE_ID || '(default)');

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { items, shipping } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Calcular el total en el servidor para mayor seguridad (en centavos para Stripe)
    const calculateOrderAmount = (cartItems, shippingInfo) => {
      // Cargar base de datos (CSV)
      const csvFilePath = path.resolve(__dirname, 'public', 'productos.csv');
      const csvFile = fs.readFileSync(csvFilePath, 'utf8');
      const results = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
      const dbProducts = results.data.map(row => ({
        id: parseInt(row.id),
        price: parseFloat(row.price)
      }));

      // Calcular subtotal usando los precios reales
      const subtotal = cartItems.reduce((acc, item) => {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        const realPrice = dbProduct ? dbProduct.price : 0;
        if (!dbProduct) console.warn(`Producto no encontrado en BD: ${item.id}`);
        return acc + (realPrice * item.quantity);
      }, 0);

      const shippingPrice = shippingInfo && shippingInfo.rate ? shippingInfo.rate.price : 0;
      // Stripe requiere el monto en la unidad mínima de la moneda (centavos para MXN)
      return Math.round((subtotal + shippingPrice) * 100);
    };

    const amount = calculateOrderAmount(items, shipping);

    if (amount <= 0) {
      return res.status(400).json({ error: 'El monto del pedido debe ser mayor a cero' });
    }

    // Crear un PaymentIntent con el monto y la moneda
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'mxn',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: `ORD-${Date.now()}`,
        customer_name: shipping?.nombre || 'Cliente',
        customer_email: shipping?.email || 'sin-email@ejemplo.com'
      }
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipping-rates', async (req, res) => {
  const { zipCode, totalItems, shippingInfo } = req.body;
  if (!zipCode || zipCode.length < 5) {
    return res.status(400).json({ error: 'Código postal inválido' });
  }

  const CLIENT_ID = process.env.SKYDROPX_CLIENT_ID;
  const CLIENT_SECRET = process.env.SKYDROPX_CLIENT_SECRET;
  
  try {
    let SKYDROPX_TOKEN = "";
    
    try {
      let tokenRes = await fetch('https://api-pro.skydropx.com/api/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
      });
      if (!tokenRes.ok) {
        tokenRes = await fetch('https://api.skydropx.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
        });
      }
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        SKYDROPX_TOKEN = tokenData.access_token;
      }
    } catch (e) {
      console.error("Error de red al obtener el token OAuth:", e);
    }

    if (!SKYDROPX_TOKEN) SKYDROPX_TOKEN = CLIENT_ID;

    const estimatedWeight = Math.max(1, totalItems * 0.5); // 500g por prenda
    const boxDimension = Math.max(10, Math.ceil(10 * Math.pow(totalItems, 1 / 3)));

    let realRates = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de espera máximo

      const response = await fetch('https://api-pro.skydropx.com/api/v1/quotations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SKYDROPX_TOKEN}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          quotation: {
            address_from: { country_code: "MX", postal_code: "45239", area_level1: "Jalisco", area_level2: "Zapopan", area_level3: "Tesistán" },
            address_to: { country_code: "MX", postal_code: zipCode, area_level1: shippingInfo.estado, area_level2: shippingInfo.ciudad, area_level3: "Centro" },
            parcels: [{ length: boxDimension, width: boxDimension, height: boxDimension, weight: estimatedWeight, package_protected: false, declared_value: 100 * totalItems }]
          }
        })
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        realRates = (data.rates || []).filter(rate => rate.success && rate.total).map((rate, index) => ({
          id: `sk_pro_${index}_${rate.id}`, carrier: rate.provider_display_name, service: rate.provider_service_name, price: parseFloat(rate.total), time: `${rate.days} días`
        }));
      } else {
        throw new Error("Fallo Skydropx Pro");
      }
    } catch (proError) {
      console.log("Pro falló, intentando estándar...");
      const responseStd = await fetch('https://api.skydropx.com/v1/quotations', {
        method: 'POST',
        headers: { 'Authorization': `Token token=${SKYDROPX_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip_from: "45239", zip_to: zipCode,
          parcels: [{ weight: estimatedWeight, height: boxDimension, width: boxDimension, length: boxDimension }]
        })
      });
      if (responseStd.ok) {
        const dataStd = await responseStd.json();
        const apiRates = dataStd.rates || (dataStd.data && dataStd.data.attributes && dataStd.data.attributes.rates) || [];
        realRates = apiRates.map((rate, index) => ({
          id: `sk_std_${index}_${rate.id}`, carrier: rate.provider || rate.carrier || "Mensajería", service: rate.service_level_name || rate.service_name || "Estándar", price: parseFloat(rate.total_pricing || rate.amount || rate.total), time: `${rate.days || 3} días`
        }));
      } else {
        throw new Error("Ambas APIs de Skydropx fallaron");
      }
    }

    let filteredRealRates = realRates.filter(rate => {
      const c = rate.carrier.toLowerCase();
      return c.includes('estafeta') || c.includes('fedex') || c.includes('dhl');
    });

    if (filteredRealRates.length === 0 && realRates.length > 0) filteredRealRates = realRates;

    const validRates = filteredRealRates.sort((a, b) => a.price - b.price);
    
    if (validRates.length > 0) {
      return res.json({ rates: validRates });
    } else {
      throw new Error("No se obtuvieron tarifas válidas");
    }
  } catch (error) {
    console.error("Usando tarifas simuladas:", error.message);
    const mockRates = [
      { id: 'sk_1', carrier: 'Estafeta', service: 'Terrestre', price: 139, time: '3-5 días' },
      { id: 'sk_2', carrier: 'FedEx', service: 'Económico', price: 155, time: '2-4 días' },
      { id: 'sk_3', carrier: 'DHL', service: 'Express', price: 210, time: '1-2 días' }
    ];
    return res.json({ rates: mockRates, isMock: true });
  }
});

// Endpoint para guardar el pedido en Firebase DESPUÉS del pago exitoso
app.post('/api/confirm-order', async (req, res) => {
  console.log("-----------------------------------------");
  console.log("1. PETICIÓN RECIBIDA EN /api/confirm-order");
  
  const { orderDetails } = req.body;
  const origin = req.get('origin');
  console.log(`Petición desde origin: ${origin}`);

  if (!orderDetails) {
    console.log("Error: No se recibieron detalles del pedido");
    return res.status(400).json({ error: 'Faltan detalles del pedido' });
  }

  console.log("2. INTENTANDO GUARDAR PEDIDO:", orderDetails.id);

  try {
    // Timeout de seguridad para Firebase (10 segundos)
    const firebasePromise = addDoc(collection(db, "pedidos"), {
      ...orderDetails,
      createdAt: new Date(),
      serverTimestamp: new Date().toISOString()
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firebase Timeout')), 10000)
    );

    const docRef = await Promise.race([firebasePromise, timeoutPromise]);
    
    console.log("3. PEDIDO GUARDADO EXITOSAMENTE. ID:", docRef.id);
    return res.status(200).json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN FIREBASE:");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({ 
      error: 'Error al persistir en base de datos', 
      message: error.message,
      code: error.code
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor de pagos corriendo en puerto ${PORT}`));
