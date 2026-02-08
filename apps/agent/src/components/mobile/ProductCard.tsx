"use client";

import React, { memo } from "react";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    productName: string;
    sku?: string;
    priceGHS: number;
    stockLevel?: number;
    quantity?: number;
  };
  onAdd: (product: any) => void;
  accentColor?: string;
}

/**
 * 🎯 OPTIMIZED PRODUCT CARD
 * - Memoized to prevent unnecessary re-renders
 * - Only re-renders when product or accent changes
 */
const ProductCard = memo(({ product, onAdd, accentColor = "#2563eb" }: ProductCardProps) => {
  const stock = product.stockLevel ?? product.quantity ?? 0;
  const isLowStock = stock < 5;
  const isOutOfStock = stock === 0;

  return (
    <div
      className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
      style={{ opacity: isOutOfStock ? 0.5 : 1 }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {product.productName}
        </h3>
        {product.sku && (
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            SKU: {product.sku}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <p className="text-lg font-black text-slate-900 dark:text-white">
            ₵{product.priceGHS.toFixed(2)}
          </p>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 border ${
              isOutOfStock
                ? 'bg-red-50 text-red-600 border-red-200'
                : isLowStock
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
          >
            {stock} IN STOCK
          </span>
        </div>
      </div>

      {!isOutOfStock && (
        <button
          onClick={() => onAdd(product)}
          className="ml-3 p-3 flex items-center justify-center border-2 transition-all duration-200 group-hover:scale-110"
          style={{
            backgroundColor: `${accentColor}10`,
            borderColor: accentColor,
            color: accentColor
          }}
          aria-label={`Add ${product.productName} to cart`}
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.priceGHS === nextProps.product.priceGHS &&
    (prevProps.product.stockLevel ?? prevProps.product.quantity) === 
    (nextProps.product.stockLevel ?? nextProps.product.quantity) &&
    prevProps.accentColor === nextProps.accentColor
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
