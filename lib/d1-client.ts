// Client helper to connect to internal API Routes

// --- Products ---
export async function fetchProducts() {
  try {
    const res = await fetch(`/api/products`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("[v0] Products API responded with status:", res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[v0] Failed to fetch products:", error);
    return [];
  }
}

export async function fetchProductById(id: string) {
  try {
    const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("[v0] Failed to fetch product:", error);
    return null;
  }
}

export async function createD1Product(productData: any) {
  try {
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
export async function fetchCategories() {
  try {
    const res = await fetch(`/api/categories`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("[v0] Categories API responded with status:", res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[v0] Failed to fetch categories:", error);
    return [];
  }
}

export async function createD1Category(name: string, description: string, imageUrl?: string) {
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