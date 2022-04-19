import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocletShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api.get(`products/${productId}`);
      const product = responseProduct.data;

      const responseStock = await api.get(`stock/${productId}`)
      const isStock = responseStock.data.amount > 0;

      if (isStock) {
        const exist = cart.some(product => product.id === productId)
        if(exist) {
          const amount = product.amount++
          await updateProductAmount({productId, amount})
        }
        setCart(product)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
      }
      toast.error('Quantidade solicitada fora de estoque');
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      cart.splice(productIndex, 1);
      setCart(cart)
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount<=0) {
        return 
      }

      const responseProduct = await api.get(`stock/${productId}`)
      const isStock = responseProduct.data.amount > 0;

      if(isStock) {
        cart.forEach(product => {
          if(product.id === productId) {
            product.amount += amount;
          }
        })
        setCart(cart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
      }else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
