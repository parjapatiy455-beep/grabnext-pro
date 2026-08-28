// Client helper to connect to internal API Routes

// --- Products ---
let _productsCache: any[] | null = null
let _categoriesCache: any[] | null = null

export function clearProductsCache() {
  _productsCache = null
  if (typeof window !== 'undefined') {
    try { sessionStorage.removeItem('gn_products_cache') } catch {}
  }
}

export function clearCategoriesCache() {
  _categoriesCache = null
  if (typeof window !== 'undefined') {
    try { sessionStorage.removeItem('gn_cats_cache') } catch {}
  }
}

export async function fetchProducts(options?: { forceRefresh?: boolean }) {
  // 1. Return in-memory cache immediately if available for 0ms render
  if (_productsCache && !options?.forceRefresh) {
    // Revalidate in background asynchronously
    fetchProductsFromAPI().then((fresh) => {
      if (fresh && fresh.length > 0) _productsCache = fresh
    })
    return _productsCache
  }

  // 2. Try sessionStorage for fast instant load across page transitions
  if (typeof window !== 'undefined' && !options?.forceRefresh) {
    try {
      const stored = sessionStorage.getItem('gn_products_cache')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          _productsCache = parsed
          // Revalidate in background
          fetchProductsFromAPI().then((fresh) => {
            if (fresh && fresh.length > 0) {
              _productsCache = fresh
              sessionStorage.setItem('gn_products_cache', JSON.stringify(fresh))
            }
          })
          return parsed
        }
      }
    } catch {}
  }

  // 3. Fresh fetch
  const fresh = await fetchProductsFromAPI()
  if (fresh && fresh.length > 0) {
    _productsCache = fresh
    if (typeof window !== 'undefined') {
      try { sessionStorage.setItem('gn_products_cache', JSON.stringify(fresh)) } catch {}
    }
  }
  return fresh
}

async function fetchProductsFromAPI() {
  try {
    const res = await fetch(`/api/products`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      console.error("[v0] Products API responded with status:", res.status)
      return _productsCache || []
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Failed to fetch products:", error)
    return _productsCache || []
  }
}

export async function fetchProductById(id: string) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("[v0] Failed to fetch product:", error);
    return null;
  }
}

export async function createD1Product(productData: any) {
  try {
    clearProductsCache()
    const res = await fetch(`/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create product");
    }
    return res.json();
  } catch (error) {
    console.error("[v0] Create Product Error:", error);
    throw error;
  }
}

export async function updateD1Product(id: string, productData: any) {
  try {
    clearProductsCache()
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update product");
    }
    return res.json();
  } catch (error) {
    console.error("[v0] Update Product Error:", error);
    throw error;
  }
}

export async function deleteD1Product(id: string) {
  try {
    clearProductsCache()
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete product");
    }
    return res.json();
  } catch (error) {
    console.error("[v0] Delete Product Error:", error);
    throw error;
  }
}

export async function reorderD1Products(payload: { items?: { id: string; displayOrder: number }[]; orderedIds?: string[] }) {
  try {
    clearProductsCache()
    const res = await fetch(`/api/products/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to reorder products");
    }
    return res.json();
  } catch (error) {
    console.error("[v0] Reorder Products Error:", error);
    throw error;
  }
}

// --- Reviews ---
export async function fetchProductReviews(productId: string) {
  try {
    const res = await fetch(`/api/reviews?productId=${productId}`, { cache: 'no-store' });
    if (!res.ok) return { reviews: [], stats: { count: 0, avgRating: '0.0' } };
    return res.json();
  } catch (error) {
    console.error("[v0] Failed to fetch reviews:", error);
    return { reviews: [], stats: { count: 0, avgRating: '0.0' } };
  }
}

export async function submitReview(reviewData: {
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment?: string;
}) {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData),
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

// --- Categories ---
export async function fetchCategories(options?: { forceRefresh?: boolean }) {
  if (_categoriesCache && !options?.forceRefresh) {
    fetchCategoriesFromAPI().then((fresh) => { if (fresh && fresh.length > 0) _categoriesCache = fresh })
    return _categoriesCache
  }
  if (typeof window !== 'undefined' && !options?.forceRefresh) {
    try {
      const stored = sessionStorage.getItem('gn_cats_cache')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          _categoriesCache = parsed
          fetchCategoriesFromAPI().then((fresh) => {
            if (fresh && fresh.length > 0) {
              _categoriesCache = fresh
              sessionStorage.setItem('gn_cats_cache', JSON.stringify(fresh))
            }
          })
          return parsed
        }
      }
    } catch {}
  }
  const fresh = await fetchCategoriesFromAPI()
  if (fresh && fresh.length > 0) {
    _categoriesCache = fresh
    if (typeof window !== 'undefined') {
      try { sessionStorage.setItem('gn_cats_cache', JSON.stringify(fresh)) } catch {}
    }
  }
  return fresh
}

async function fetchCategoriesFromAPI() {
  try {
    const res = await fetch(`/api/categories`, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return _categoriesCache || []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("[v0] Failed to fetch categories:", error)
    return _categoriesCache || []
  }
}

export async function createD1Category(name: string, description: string, imageUrl?: string) {
  clearCategoriesCache()
  const res = await fetch(`/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, imageUrl: imageUrl || "" }),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}


// --- Orders ---
export async function createD1Order(orderData: any) {
  const res = await fetch(`/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}

export async function getUserOrders(userId: string) {
  try {
    const res = await fetch(`/api/orders/user/${userId}`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[v0] User orders API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[v0] Failed to fetch user orders:", error);
    return [];
  }
}

export async function fetchAllOrders() {
  try {
    const res = await fetch(`/api/orders`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("[v0] Orders API responded with status:", res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[v0] Failed to fetch orders:", error);
    return [];
  }
}

// --- Users ---
export async function fetchAllUsers() {
  try {
    const res = await fetch(`/api/users`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("[v0] Users API responded with status:", res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[v0] Failed to fetch users:", error);
    return [];
  }
}