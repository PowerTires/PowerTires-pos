const STORAGE_KEY = "powertires_inventory_v02";
let inventory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let editingId = null;

function saveInventory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

function peso(value) {
  const amount = Number(value || 0);
  return "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function productName(item) {
  return [item.brand, item.size, item.pattern].filter(Boolean).join(" ");
}

function showDashboard() {
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalValue = inventory.reduce((sum, item) => sum + Number(item.cost || 0) * Number(item.quantity || 0), 0);
  const lowStock = inventory.filter(item => Number(item.quantity || 0) <= Number(item.reorder || 0)).length;

  document.getElementById("app").innerHTML = `
    <section class="card">
      <h2>Dashboard</h2>
      <p>Welcome to PowerTires POS.</p>
    </section>

    <section class="dashboard-grid">
      <div class="stat">
        <h3>Total Products</h3>
        <p>${totalItems}</p>
      </div>
      <div class="stat">
        <h3>Total Stock</h3>
        <p>${totalStock}</p>
      </div>
      <div class="stat">
        <h3>Inventory Value</h3>
        <p>${peso(totalValue)}</p>
      </div>
      <div class="stat">
        <h3>Low Stock Items</h3>
        <p>${lowStock}</p>
      </div>
    </section>

    <section class="card">
      <button class="primary-btn" onclick="showInventory()">Open Inventory</button>
    </section>
  `;
}

function showInventory(searchText = "") {
  const filtered = inventory.filter(item => {
    const text = `${item.category} ${item.brand} ${item.size} ${item.pattern} ${item.supplier} ${item.notes}`.toLowerCase();
    return text.includes(searchText.toLowerCase());
  });

  document.getElementById("app").innerHTML = `
    <section class="card">
      <h2>${editingId ? "Edit Product" : "Add Product"}</h2>

      <div class="form-grid">
        <label>Category
          <select id="category">
            <option>Truck Tire</option>
            <option>Car Tire</option>
            <option>Battery</option>
            <option>Oil</option>
            <option>Tube</option>
            <option>Rim</option>
            <option>Others</option>
          </select>
        </label>

        <label>Brand
          <input id="brand" placeholder="Example: Westlake">
        </label>

        <label>Size
          <input id="size" placeholder="Example: 11R22.5">
        </label>

        <label>Pattern / Model
          <input id="pattern" placeholder="Example: CR976A">
        </label>

        <label>Supplier
          <input id="supplier" placeholder="Example: YC Marketing">
        </label>

        <label>Cost Price
          <input id="cost" type="number" placeholder="0">
        </label>

        <label>Stock Quantity
          <input id="quantity" type="number" placeholder="0">
        </label>

        <label>Reorder Level
          <input id="reorder" type="number" placeholder="0">
        </label>
      </div>

      <label style="margin-top:12px;">Notes
        <textarea id="notes" placeholder="Optional notes"></textarea>
      </label>

      <div class="actions">
        <button class="primary-btn" onclick="saveProduct()">${editingId ? "Update Product" : "Save Product"}</button>
        ${editingId ? `<button class="secondary-btn" onclick="cancelEdit()">Cancel Edit</button>` : ""}
      </div>
    </section>

    <section class="card">
      <h2>Inventory List</h2>

      <div class="search-row">
        <input id="search" placeholder="Search brand, size, pattern, supplier..." value="${searchText}" oninput="showInventory(this.value)">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Brand</th>
              <th>Size</th>
              <th>Pattern</th>
              <th>Supplier</th>
              <th>Cost</th>
              <th>Stock</th>
              <th>Reorder</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${renderInventoryRows(filtered)}
          </tbody>
        </table>
      </div>
    </section>
  `;

  if (editingId) {
    fillEditForm();
  }
}

function renderInventoryRows(items) {
  if (items.length === 0) {
    return `<tr><td colspan="10" class="empty">No products yet. Add your first product above.</td></tr>`;
  }

  return items.map(item => {
    const isLow = Number(item.quantity || 0) <= Number(item.reorder || 0);
    return `
      <tr>
        <td>${item.category || ""}</td>
        <td>${item.brand || ""}</td>
        <td>${item.size || ""}</td>
        <td>${item.pattern || ""}</td>
        <td>${item.supplier || ""}</td>
        <td>${peso(item.cost)}</td>
        <td class="${isLow ? "low-stock" : ""}">${item.quantity || 0}</td>
        <td>${item.reorder || 0}</td>
        <td>${item.notes || ""}</td>
        <td>
          <button class="small-btn edit" onclick="editProduct('${item.id}')">Edit</button>
          <button class="small-btn delete" onclick="deleteProduct('${item.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function saveProduct() {
  const product = {
    id: editingId || Date.now().toString(),
    category: document.getElementById("category").value,
    brand: document.getElementById("brand").value.trim(),
    size: document.getElementById("size").value.trim(),
    pattern: document.getElementById("pattern").value.trim(),
    supplier: document.getElementById("supplier").value.trim(),
    cost: Number(document.getElementById("cost").value || 0),
    quantity: Number(document.getElementById("quantity").value || 0),
    reorder: Number(document.getElementById("reorder").value || 0),
    notes: document.getElementById("notes").value.trim()
  };

  if (!product.brand && !product.size && !product.pattern) {
    alert("Please enter at least brand, size, or pattern.");
    return;
  }

  if (editingId) {
    inventory = inventory.map(item => item.id === editingId ? product : item);
    editingId = null;
  } else {
    inventory.push(product);
  }

  saveInventory();
  showInventory();
}

function editProduct(id) {
  editingId = id;
  showInventory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fillEditForm() {
  const item = inventory.find(p => p.id === editingId);
  if (!item) return;

  document.getElementById("category").value = item.category || "Truck Tire";
  document.getElementById("brand").value = item.brand || "";
  document.getElementById("size").value = item.size || "";
  document.getElementById("pattern").value = item.pattern || "";
  document.getElementById("supplier").value = item.supplier || "";
  document.getElementById("cost").value = item.cost || "";
  document.getElementById("quantity").value = item.quantity || "";
  document.getElementById("reorder").value = item.reorder || "";
  document.getElementById("notes").value = item.notes || "";
}

function cancelEdit() {
  editingId = null;
  showInventory();
}

function deleteProduct(id) {
  const item = inventory.find(p => p.id === id);
  if (!item) return;

  if (confirm(`Delete ${productName(item) || "this product"}?`)) {
    inventory = inventory.filter(p => p.id !== id);
    saveInventory();
    showInventory();
  }
}

function comingSoon(feature) {
  document.getElementById("app").innerHTML = `
    <section class="card">
      <h2>${feature}</h2>
      <p>${feature} feature coming soon.</p>
      <button class="primary-btn" onclick="showDashboard()">Back to Dashboard</button>
    </section>
  `;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

showDashboard();
