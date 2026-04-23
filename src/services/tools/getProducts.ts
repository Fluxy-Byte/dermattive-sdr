import axios from "axios"

export interface Product {
  id: number;
  name: string;
  about: string;
  image_url: string;
  category: string;
  active: boolean;
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

interface ResultGet{
    status: boolean;
    data: Product[]
}

export async function getProductsApi() {
    try {
        const { data } = await axios.get("https://dermattive-be.egnehl.easypanel.host/api/product");
        const res: ResultGet = data;
        return {
            status: res.status,
            products: res.data,
            message: "Consulta concluida com sucesso"
        }
    } catch (e) {
        return {
            status: false,
            products: [],
            message: "Tivemos um erro na coleta de nossos produtos"
        }
    }
}