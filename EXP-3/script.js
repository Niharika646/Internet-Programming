const getData = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
};

const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

let currentUser = null;
let selectedSeats = {};

let users = getData("busUsers");
let buses = getData("busList");
let bookings = getData("busBookings");
let comments = getData("busComments");

// SAMPLE BUSES
if (buses.length === 0) {
    buses = [
        {
            id: 1,
            name: "Express Travels",
            from: "Chennai",
            to: "Bangalore",
            time: "21:00",
            category: "Volvo",
            seats: 10,
            price: 650
        },
        {
            id: 2,
            name: "City Sleeper",
            from: "Chennai",
            to: "Hyderabad",
            time: "20:30",
            category: "Sleeper Coach",
            seats: 10,
            price: 850
        }
    ];

    saveData("busList", buses);
}

// SHOW PAGES
function showPage(id) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    const page = document.getElementById(id);

    if (page) {
        page.classList.remove("hidden");
    }

    if (id === "bookings") showBookings();
    if (id === "comments") showComments();
    if (id === "admin") showAdmin();
}

// LOGOUT
function logout() {
    currentUser = null;
    selectedSeats = {};

    alert("Logged out successfully!");
    showPage("home");
}

// USER REGISTRATION
document.getElementById("registerForm").onsubmit = function(e) {
    e.preventDefault();

    users = getData("busUsers");

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail")
        .value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;

    if (users.some(user => user.email.toLowerCase() === email)) {
        alert("Email already registered. Please login.");
        showPage("userLogin");
        return;
    }

    users.push({
        name: name,
        email: email,
        password: password
    });

    saveData("busUsers", users);

    alert("Registration successful! Please login.");

    this.reset();
    showPage("userLogin");
};

// USER LOGIN
document.getElementById("userLoginForm").onsubmit = function(e) {
    e.preventDefault();

    users = getData("busUsers");

    const email = document.getElementById("userEmail")
        .value.trim().toLowerCase();
    const password = document.getElementById("userPassword").value;

    const user = users.find(u =>
        u.email.toLowerCase() === email &&
        u.password === password
    );

    if (!user) {
        alert("Invalid email or password. Please register first.");
        return;
    }

    currentUser = {
        name: user.name,
        email: user.email,
        role: "user"
    };

    alert("Welcome " + user.name + "! Login successful.");

    this.reset();
    showPage("home");
};

// ADMIN LOGIN
document.getElementById("adminLoginForm").onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById("adminUsername")
        .value.trim();
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "admin123") {
        currentUser = {
            name: "Admin",
            role: "admin"
        };

        alert("Admin login successful!");

        this.reset();
        showPage("admin");
    } else {
        alert("Invalid admin username or password.");
    }
};

// BUS SEARCH
document.getElementById("searchForm").onsubmit = function(e) {
    e.preventDefault();

    const from = document.getElementById("from")
        .value.trim().toLowerCase();
    const to = document.getElementById("to")
        .value.trim().toLowerCase();
    const date = document.getElementById("date").value;

    if (!date) {
        alert("Please select journey date.");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(date + "T00:00:00") < today) {
        alert("Please select today or a future date.");
        return;
    }

    buses = getData("busList");

    const results = buses.filter(bus =>
        bus.from.toLowerCase() === from &&
        bus.to.toLowerCase() === to
    );

    const container = document.getElementById("busResults");

    if (results.length === 0) {
        container.innerHTML = "<p>No buses found for this route.</p>";
        return;
    }

    selectedSeats = {};

    container.innerHTML = results.map(bus => {
        const bookedSeats = getData("busBookings")
            .filter(b =>
                b.busId === bus.id &&
                b.date === date &&
                b.status === "Booked"
            )
            .flatMap(b => b.seats);

        const available = bus.seats - new Set(bookedSeats).size;

        return `
            <div class="bus-card">
                <h3>${bus.name}</h3>
                <p>Route: ${bus.from} to ${bus.to}</p>
                <p>Time: ${bus.time}</p>
                <p>Category: ${bus.category}</p>
                <p>Ticket Price: ₹${bus.price}</p>
                <p>Available Seats: ${available}</p>

                <h4>Select Seats</h4>

                <div class="seats">
                    ${Array.from(
                        { length: bus.seats },
                        (_, i) => i + 1
                    ).map(seat => `
                        <button type="button"
                            class="seat"
                            data-bus="${bus.id}"
                            data-seat="${seat}"
                            ${bookedSeats.includes(seat) ? "disabled" : ""}>
                            ${seat}
                        </button>
                    `).join("")}
                </div>

                <label>Passenger Name</label>
                <input id="passenger-${bus.id}"
                       placeholder="Enter passenger name">

                <button type="button"
                    onclick="bookTicket(${bus.id}, '${date}')">
                    Book Ticket
                </button>
            </div>
        `;
    }).join("");

    container.querySelectorAll(".seat:not(:disabled)")
        .forEach(button => {
            button.onclick = function() {
                const busId = this.dataset.bus;
                const seat = Number(this.dataset.seat);

                if (!selectedSeats[busId]) {
                    selectedSeats[busId] = [];
                }

                if (selectedSeats[busId].includes(seat)) {
                    selectedSeats[busId] =
                        selectedSeats[busId].filter(s => s !== seat);

                    this.classList.remove("selected");
                } else {
                    selectedSeats[busId].push(seat);
                    this.classList.add("selected");
                }
            };
        });
};

// BOOK TICKET
function bookTicket(busId, date) {
    if (!currentUser || currentUser.role !== "user") {
        alert("Please login using User Login before booking.");
        showPage("userLogin");
        return;
    }

    const passenger = document.getElementById(
        "passenger-" + busId
    ).value.trim();

    const seats = selectedSeats[busId] || [];

    if (!passenger) {
        alert("Please enter passenger name.");
        return;
    }

    if (seats.length === 0) {
        alert("Please select at least one seat.");
        return;
    }

    buses = getData("busList");
    bookings = getData("busBookings");

    const bus = buses.find(b => b.id === busId);

    if (!bus) {
        alert("Bus not found.");
        return;
    }

    const alreadyBooked = bookings
        .filter(b =>
            b.busId === busId &&
            b.date === date &&
            b.status === "Booked"
        )
        .flatMap(b => b.seats);

    if (seats.some(s => alreadyBooked.includes(s))) {
        alert("A selected seat is already booked. Please search again.");
        return;
    }

    if (seats.some(s => s < 1 || s > bus.seats)) {
        alert("Invalid seat selection.");
        return;
    }

    const booking = {
        id: Date.now(),
        busId: bus.id,
        busName: bus.name,
        from: bus.from,
        to: bus.to,
        date: date,
        time: bus.time,
        passenger: passenger,
        email: currentUser.email,
        seats: [...seats],
        total: seats.length * bus.price,
        status: "Booked"
    };

    bookings.push(booking);
    saveData("busBookings", bookings);

    selectedSeats[busId] = [];

    alert(
        "Ticket booked successfully!\n" +
        "Booking ID: " + booking.id + "\n" +
        "Seats: " + booking.seats.join(", ") + "\n" +
        "Total Amount: ₹" + booking.total
    );

    showPage("bookings");
}

// BOOKING HISTORY
function showBookings() {
    const container = document.getElementById("bookingList");

    if (!currentUser) {
        container.innerHTML =
            "<p>Please login to view booking history.</p>";
        return;
    }

    bookings = getData("busBookings");

    const list = currentUser.role === "admin"
        ? bookings
        : bookings.filter(b => b.email === currentUser.email);

    if (list.length === 0) {
        container.innerHTML = "<p>No bookings found.</p>";
        return;
    }

    container.innerHTML = list.map(b => `
        <div class="item-card">
            <h3>${b.busName}</h3>
            <p>Booking ID: ${b.id}</p>
            <p>Passenger: ${b.passenger}</p>
            <p>Route: ${b.from} to ${b.to}</p>
            <p>Date: ${b.date} | Time: ${b.time}</p>
            <p>Seats: ${b.seats.join(", ")}</p>
            <p>Total: ₹${b.total}</p>
            <p>Status: ${b.status}</p>

            ${b.status === "Booked"
                ? `<button onclick="cancelBooking(${b.id})">
                    Cancel Ticket
                   </button>`
                : ""}
        </div>
    `).join("");
}

// CANCEL TICKET
function cancelBooking(id) {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    bookings = getData("busBookings");

    const booking = bookings.find(b => b.id === id);

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    if (currentUser.role !== "admin" &&
        booking.email !== currentUser.email) {
        alert("You cannot cancel another user's ticket.");
        return;
    }

    if (booking.status !== "Booked") {
        alert("Ticket is already cancelled.");
        return;
    }

    if (confirm("Do you want to cancel this ticket?")) {
        booking.status = "Cancelled";

        saveData("busBookings", bookings);

        alert("Ticket cancelled successfully!");
        showBookings();
    }
}

// POST COMMENTS
document.getElementById("commentForm").onsubmit = function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "user") {
        alert("Please login as a user to post comments.");
        showPage("userLogin");
        return;
    }

    const bus = document.getElementById("commentBus").value.trim();
    const message = document.getElementById("commentText").value.trim();

    if (!bus || !message) {
        alert("Please enter bus name and comment.");
        return;
    }

    comments = getData("busComments");

    comments.push({
        name: currentUser.name,
        bus: bus,
        text: message
    });

    saveData("busComments", comments);

    this.reset();
    showComments();

    alert("Comment posted successfully!");
};

// DISPLAY COMMENTS
function showComments() {
    comments = getData("busComments");

    const container = document.getElementById("commentList");

    if (comments.length === 0) {
        container.innerHTML = "<p>No comments available.</p>";
        return;
    }

    container.innerHTML = comments.map(c => `
        <div class="item-card">
            <h3>${c.bus}</h3>
            <p>${c.text}</p>
            <small>Posted by ${c.name}</small>
        </div>
    `).join("");
}

// ADMIN PANEL
function showAdmin() {
    const controls = document.getElementById("adminControls");
    const status = document.getElementById("adminStatus");

    if (!currentUser || currentUser.role !== "admin") {
        controls.classList.add("hidden");
        status.textContent = "Please login as admin to continue.";
        return;
    }

    controls.classList.remove("hidden");
    status.textContent = "Welcome, Admin!";

    showAdminBuses();
    showUsers();
}

// ADD OR UPDATE BUS
document.getElementById("busForm").onsubmit = function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    buses = getData("busList");

    const id = document.getElementById("busId").value;

    const bus = {
        id: id ? Number(id) : Date.now(),
        name: document.getElementById("busName").value.trim(),
        from: document.getElementById("busFrom").value.trim(),
        to: document.getElementById("busTo").value.trim(),
        time: document.getElementById("busTime").value,
        category: document.getElementById("busCategory").value,
        seats: Number(document.getElementById("busSeats").value),
        price: Number(document.getElementById("busPrice").value)
    };

    if (bus.seats < 1 || bus.seats > 60 || bus.price < 1) {
        alert("Enter valid seat count and ticket price.");
        return;
    }

    if (id) {
        const oldBus = buses.find(b => b.id === Number(id));

        if (oldBus && bus.seats < oldBus.seats) {
            const hasBookings = getData("busBookings").some(b =>
                b.busId === oldBus.id &&
                b.status === "Booked" &&
                b.seats.some(s => s > bus.seats)
            );

            if (hasBookings) {
                alert("Cannot reduce seats because booked seats exist.");
                return;
            }
        }

        buses = buses.map(b => b.id === Number(id) ? bus : b);
    } else {
        buses.push(bus);
    }

    saveData("busList", buses);

    this.reset();
    document.getElementById("busId").value = "";

    alert("Bus information saved successfully!");

    showAdminBuses();
};

// DISPLAY BUSES TO ADMIN
function showAdminBuses() {
    buses = getData("busList");

    document.getElementById("adminBusList").innerHTML =
        buses.map(b => `
            <div class="item-card">
                <h3>${b.name}</h3>
                <p>${b.from} to ${b.to}</p>
                <p>Category: ${b.category}</p>
                <p>Time: ${b.time}</p>
                <p>Seats: ${b.seats} | Price: ₹${b.price}</p>

                <button onclick="editBus(${b.id})">Edit</button>
                <button onclick="deleteBus(${b.id})">Delete</button>
            </div>
        `).join("");
}

// EDIT BUS
function editBus(id) {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    const bus = getData("busList").find(b => b.id === id);

    if (!bus) return;

    document.getElementById("busId").value = bus.id;
    document.getElementById("busName").value = bus.name;
    document.getElementById("busFrom").value = bus.from;
    document.getElementById("busTo").value = bus.to;
    document.getElementById("busTime").value = bus.time;
    document.getElementById("busCategory").value = bus.category;
    document.getElementById("busSeats").value = bus.seats;
    document.getElementById("busPrice").value = bus.price;

    document.getElementById("busForm").scrollIntoView({
        behavior: "smooth"
    });
}

// DELETE BUS
function deleteBus(id) {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    if (!confirm("Are you sure you want to delete this bus?")) {
        return;
    }

    buses = getData("busList");
    buses = buses.filter(b => b.id !== id);

    saveData("busList", buses);

    alert("Bus deleted successfully!");
    showAdminBuses();
}

// DISPLAY REGISTERED USERS
function showUsers() {
    users = getData("busUsers");

    const container = document.getElementById("userList");

    if (users.length === 0) {
        container.innerHTML = "<p>No registered users.</p>";
        return;
    }

    container.innerHTML = users.map(u => `
        <div class="item-card">
            <h3>${u.name}</h3>
            <p>Email: ${u.email}</p>
        </div>
    `).join("");
}

// GENERATE REPORT
function generateReport() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    buses = getData("busList");
    users = getData("busUsers");
    bookings = getData("busBookings");

    const active = bookings.filter(b => b.status === "Booked");
    const cancelled = bookings.filter(b => b.status === "Cancelled");

    const revenue = active.reduce((sum, b) => sum + b.total, 0);

    document.getElementById("report").innerHTML = `
        <div class="item-card">
            <h3>Bus Booking Report</h3>
            <p>Total Buses: ${buses.length}</p>
            <p>Registered Users: ${users.length}</p>
            <p>Total Bookings: ${bookings.length}</p>
            <p>Active Bookings: ${active.length}</p>
            <p>Cancelled Bookings: ${cancelled.length}</p>
            <p>Total Active Booking Value: ₹${revenue}</p>
        </div>
    `;
}

// DOWNLOAD REPORT AS CSV
function downloadReport() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    bookings = getData("busBookings");

    const rows = [
        [
            "Booking ID", "Bus", "Passenger", "Email",
            "From", "To", "Date", "Seats", "Total", "Status"
        ],
        ...bookings.map(b => [
            b.id, b.busName, b.passenger, b.email,
            b.from, b.to, b.date, b.seats.join(" "),
            b.total, b.status
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bus_booking_report.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// SET MINIMUM JOURNEY DATE
function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

document.getElementById("date").min = getToday();

// OPEN HOME PAGE
showPage("home");