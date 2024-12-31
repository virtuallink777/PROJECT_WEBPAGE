import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4004", // Cambia según sea necesario
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
