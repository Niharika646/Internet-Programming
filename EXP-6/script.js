
const readData = (key, fallback = []) =>
    JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));

const saveData = (key, data) =>
    localStorage.setItem(key, JSON.stringify(data));

let cakes = readData("sweetCakes", [
    {
        id: 1, name: "Chocolate Cake", price: 600,
        category: "Birthday", flavor: "Chocolate", stock: 10,
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500"
    },
    {
        id: 2, name: "Vanilla Cake", price: 450,
        category: "Birthday", flavor: "Vanilla", stock: 10,
        image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500"
    },
    {
        id: 3, name: "Strawberry Cake", price: 550,
        category: "Anniversary", flavor: "Strawberry", stock: 8,
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500"
    },
    {
        id: 4, name: "Black Forest Cake", price: 650,
        category: "Special", flavor: "Black Forest", stock: 6,
        image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500"
    }
]);

let users = readData("sweetUsers");
let orders = readData("sweetOrders");
let currentUser = sessionStorage.getItem("sweetCurrentUser") || "";
let selectedCake = null;

saveData("sweetCakes", cakes);

function showPage(id) {
    document.querySelectorAll(".page").forEach(p =>
        p.classList.add("hidden")
    );
    document.getElementById(id).classList.remove("hidden");

    if (id === "orders") showOrders();
    if (id === "admin") refreshAdmin();
}

function displayCakes() {
    const category = document.getElementById("categoryFilter").value;
    const flavor = document.getElementById("flavorFilter").value;
    const list = document.getElementById("cakeList");

    list.innerHTML = "";

    const filtered = cakes.filter(c =>
        (category === "All" || c.category === category) &&
        (flavor === "All" || c.flavor === flavor)
    );

    if (filtered.length === 0) {
        list.textContent = "No cakes found in this category.";
        return;
    }

    filtered.forEach(c => {
        const card = document.createElement("div");
        card.className = "cake-card";

        const img = document.createElement("img");
        img.src = c.image || "https://placehold.co/400x250?text=Cake";
        img.alt = c.name;
        img.onerror = () => {
            img.src = "https://placehold.co/400x250?text=Cake";
        };

        const title = document.createElement("h3");
        title.textContent = c.name;

        const details = document.createElement("p");
        details.textContent =
            `${c.flavor} | ${c.category} | ₹${c.price} per kg | Stock: ${c.stock}`;

        const button = document.createElement("button");
        button.textContent = "Order Now";
        button.disabled = c.stock <= 0;
        button.addEventListener("click", () => chooseCake(c.id));

        card.append(img, title, details, button);
        list.appendChild(card);
    });
}

document.getElementById("categoryFilter").addEventListener("change", displayCakes);
document.getElementById("flavorFilter").addEventListener("change", displayCakes);

function chooseCake(id) {
    if (!currentUser) {
        alert("Please register and log in first.");
        showPage("login");
        return;
    }

    selectedCake = cakes.find(c => c.id === id);

    if (!selectedCake || selectedCake.stock <= 0) {
        alert("This cake is currently unavailable.");
        return;
    }

    document.getElementById("selectedCake").textContent =
        `${selectedCake.name} — ₹${selectedCake.price} per kg`;

    document.getElementById("deliveryDate").min =
        new Date().toISOString().split("T")[0];

    document.getElementById("orderFlavor").value = selectedCake.flavor;
    showPage("order");
}

document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;

    if (users.some(u => u.email === email)) {
        document.getElementById("registerMessage").textContent =
            "This email is already registered.";
        return;
    }

    users.push({ name, email, password });
    saveData("sweetUsers", users);

    document.getElementById("registerMessage").textContent =
        "Registration successful. Please log in.";
    this.reset();
});

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        document.getElementById("loginMessage").textContent =
            "Invalid email or password.";
        return;
    }

    currentUser = user.email;
    sessionStorage.setItem("sweetCurrentUser", currentUser);

    document.getElementById("loginMessage").textContent = "Login successful.";
    showPage("home");
});

function logout() {
    currentUser = "";
    sessionStorage.removeItem("sweetCurrentUser");
    alert("Logged out successfully.");
    showPage("home");
}

document.getElementById("orderForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!currentUser || !selectedCake || selectedCake.stock <= 0) {
        alert("Please log in and select an available cake.");
        showPage("home");
        return;
    }

    const size = Number(document.getElementById("cakeSize").value);

    if (![0.5, 1, 2].includes(size)) {
        alert("Please select a valid cake size.");
        return;
    }

    const latestCake = cakes.find(c => c.id === selectedCake.id);
    if (!latestCake || latestCake.stock <= 0) {
        alert("Sorry, this cake is out of stock.");
        return;
    }

    const order = {
        id: "CK" + Date.now().toString().slice(-8),
        email: currentUser,
        cakeName: latestCake.name,
        cakeId: latestCake.id,
        size,
        flavor: document.getElementById("orderFlavor").value,
        message: document.getElementById("cakeMessage").value.trim(),
        address: document.getElementById("deliveryAddress").value.trim(),
        date: document.getElementById("deliveryDate").value,
        payment: document.getElementById("paymentMethod").value,
        total: Math.round(latestCake.price * size),
        status: "Order Placed"
    };

    if (!order.address || !order.date) {
        alert("Please enter delivery address and date.");
        return;
    }

    latestCake.stock--;
    orders.push(order);
    saveData("sweetCakes", cakes);
    saveData("sweetOrders", orders);

    document.getElementById("confirmationDetails").innerHTML = `
        <div class="order-card">
            <h3>Thank you for your order!</h3>
            <p><b>Order ID:</b> ${order.id}</p>
            <p><b>Cake:</b> ${order.cakeName}</p>
            <p><b>Size:</b> ${order.size} kg</p>
            <p><b>Flavor:</b> ${order.flavor}</p>
            <p><b>Message:</b> ${order.message || "No message"}</p>
            <p><b>Delivery Date:</b> ${order.date}</p>
            <p><b>Address:</b> ${order.address}</p>
            <p><b>Total:</b> ₹${order.total}</p>
            <p><b>Payment:</b> ${order.payment}</p>
            <p><b>Status:</b> ${order.status}</p>
        </div>
    `;

    this.reset();
    displayCakes();
    showPage("confirmation");
});

function showOrders() {
    const list = document.getElementById("orderHistory");
    list.innerHTML = "";

    if (!currentUser) {
        list.textContent = "Please log in to view your orders.";
        return;
    }

    const myOrders = orders.filter(o => o.email === currentUser);

    if (!myOrders.length) {
        list.textContent = "You have not placed any orders yet.";
        return;
    }

    myOrders.forEach(o => {
        const card = document.createElement("div");
        card.className = "order-card";

        const info = document.createElement("div");
        info.innerHTML = `
            <p><b>Order ID:</b> ${o.id}</p>
            <p><b>Cake:</b> ${o.cakeName} (${o.size} kg)</p>
            <p><b>Delivery Date:</b> ${o.date}</p>
            <p><b>Total:</b> ₹${o.total}</p>
            <p><b>Status:</b> ${o.status}</p>
        `;
        card.appendChild(info);

        if (o.status !== "Cancelled") {
            const cancel = document.createElement("button");
            cancel.textContent = "Cancel Order";
            cancel.addEventListener("click", () => cancelOrder(o.id));
            card.appendChild(cancel);
        }

        list.appendChild(card);
    });
}

function cancelOrder(id) {
    const order = orders.find(o => o.id === id && o.email === currentUser);

    if (!order || order.status === "Cancelled") return;

    if (!confirm("Do you want to cancel this order?")) return;

    order.status = "Cancelled";

    const cake = cakes.find(c => c.id === order.cakeId);
    if (cake) cake.stock++;

    saveData("sweetOrders", orders);
    saveData("sweetCakes", cakes);

    showOrders();
    displayCakes();
}

document.getElementById("adminLoginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "admin123") {
        document.getElementById("adminPanel").classList.remove("hidden");
        refreshAdmin();
        alert("Admin login successful.");
    } else {
        alert("Invalid admin credentials.");
    }
});

document.getElementById("cakeForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const cake = {
        id: Date.now(),
        name: document.getElementById("cakeName").value.trim(),
        price: Number(document.getElementById("cakePrice").value),
        category: document.getElementById("cakeCategory").value,
        flavor: document.getElementById("cakeFlavor").value,
        image: document.getElementById("cakeImage").value.trim(),
        stock: Number(document.getElementById("cakeStock").value)
    };

    if (cake.price <= 0 || cake.stock < 0) {
        alert("Enter a valid price and stock quantity.");
        return;
    }

    cakes.push(cake);
    saveData("sweetCakes", cakes);

    this.reset();
    refreshAdmin();
    displayCakes();
    alert("Cake added successfully.");
});

function refreshAdmin() {
    const cakeList = document.getElementById("adminCakeList");
    const orderList = document.getElementById("adminOrderList");
    const userList = document.getElementById("adminUserList");

    if (!cakeList || !orderList || !userList) return;

    cakeList.innerHTML = "";
    cakes.forEach(c => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.textContent =
            `${c.name} | ₹${c.price}/kg | Stock: ${c.stock} `;

        const button = document.createElement("button");
        button.textContent = "Delete Cake";
        button.addEventListener("click", () => {
            if (!confirm("Delete this cake?")) return;
            cakes = cakes.filter(item => item.id !== c.id);
            saveData("sweetCakes", cakes);
            refreshAdmin();
            displayCakes();
        });

        card.appendChild(button);
        cakeList.appendChild(card);
    });

    orderList.innerHTML = "";

    if (!orders.length) {
        orderList.textContent = "No orders available.";
    }

    orders.forEach(o => {
        const card = document.createElement("div");
        card.className = "order-card";

        const info = document.createElement("p");
        info.textContent =
            `${o.id} | ${o.cakeName} | ${o.email} | ${o.status}`;

        const status = document.createElement("select");
        ["Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
            .forEach(s => {
                const option = document.createElement("option");
                option.value = s;
                option.textContent = s;
                if (s === o.status) option.selected = true;
                status.appendChild(option);
            });

        status.addEventListener("change", () => {
            o.status = status.value;
            saveData("sweetOrders", orders);
            showOrders();
        });

        card.append(info, status);
        orderList.appendChild(card);
    });

    userList.innerHTML = "";

    if (!users.length) {
        userList.textContent = "No registered users.";
    } else {
        users.forEach(u => {
            const p = document.createElement("p");
            p.textContent = `${u.name} — ${u.email}`;
            userList.appendChild(p);
        });
    }
}

displayCakes();
