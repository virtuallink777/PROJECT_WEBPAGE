// utils/openpay.ts
const Openpay = require("openpay"); // Usa import con namespace

const openpay = new Openpay(
  process.env.OPENPAY_MERCHANT_ID || "", // tu ID
  process.env.OPENPAY_PRIVATE_KEY || "", // tu llave privada
  true // si quieres usar sandbox pon 'true'
);

openpay.setProductionReady(false); // false = modo sandbox

export default openpay;
