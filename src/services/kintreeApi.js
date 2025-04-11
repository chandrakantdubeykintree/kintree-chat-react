import axios from "axios";
import { tokenService } from "./tokenService";

export const kintreeApi = axios.create({
  baseURL: import.meta.env.VITE_KINTREE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-key": "kintreerestapi",
  },
});

kintreeApi.interceptors.request.use(
  (config) => {
    const token = tokenService.getLoginToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
