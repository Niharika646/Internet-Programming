
const getData = (key, fallback = []) =>
    JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));

const saveData = (key, data) =>
    localStorage.setItem(key, JSON.stringify(data));

let flights = getData("airFlights", [
    { id: 1, name: "Sky Express", from: "Chennai", to: "Delhi",
      time: "09:00", fare: 4500, seats: 10 },
    { id: 2, name: "Air Connect", from: "Chennai", to: "Bengaluru",
      time: "11:30", fare: 2500, seats: 10 },
    { id: 3, name: "Blue Wings", from: "Hyderabad", to: "Mumbai",
      time: "15:00", fare: 3200, seats: 10 },
    { id: 4, name: "Sky Express", from: "Delhi", to: "Mumbai",
      time: "18:00", fare: 4000, seats: 10 }
]);

let users = getData("airUsers");
let tickets = getData("airTickets");
let currentUser = sessionStorage.getItem("airCurrentUser") || "";
let currentFlight = null;
let currentDate = "";
let currentClass = "Economy";

saveData("airFlights", flights);

function showPage(id) {
    document.querySelectorAll(".page").forEach(page =>
        page.classList.add("hidden")
    );
    document.getElementById(id).classList.remove("hidden");

    if (id === "bookings") showBookings();
    if (id === "admin") refreshAdmin();
}

document.getElementById("travelDate").min =
    new Date().toISOString().split("T")[0];

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
    saveData("airUsers", users);

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
    sessionStorage.setItem("airCurrentUser", currentUser);
    document.getElementById("loginMessage").textContent =
        "Login successful. You can now book flights.";
    showPage("home");
});

function logout() {
    currentUser = "";
    sessionStorage.removeItem("airCurrentUser");
    alert("You have been logged out.");
    showPage("home");
}

function classMultiplier() {
    const c = document.getElementById("travelClass").value;
    return c === "Business" ? 2 : c === "First Class" ? 3 : 1;
}

document.getElementById("searchForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    currentDate = document.getElementById("travelDate").value;
    currentClass = document.getElementById("travelClass").value;

    if (from === to) {
        alert("Source and destination must be different.");
        return;
    }

    const results = flights.filter(f =>
        f.from.toLowerCase() === from.toLowerCase() &&
        f.to.toLowerCase() === to.toLowerCase() &&
        f.seats > 0
    );

    const container = document.getElementById("flightResults");
    container.innerHTML = "";

    if (results.length === 0) {
        container.textContent = "No available flights found for this route.";
        return;
    }

    results.forEach(f => {
        const fare = Math.round(f.fare * classMultiplier());
        const card = document.createElement("div");
        card.className = "flight-card";
        card.innerHTML = `
            <h3>${f.name}</h3>
            <p>${f.from} → ${f.to}</p>
            <p>Departure: ${f.time}</p>
            <p>Available seats: ${f.seats}</p>
            <p>Class: ${currentClass}</p>
            <p>Fare: ₹${fare}</p>
            <button type="button">Book Flight</button>
        `;
        card.querySelector("button").addEventListener("click", () => startBooking(f.id));
        container.appendChild(card);
    });
});

function startBooking(flightId) {
    if (!currentUser) {
        alert("Please register and log in before booking.");
        showPage("login");
        return;
    }

    currentFlight = flights.find(f => f.id === flightId);
    if (!currentFlight || currentFlight.seats < 1) {
        alert("No seats available.");
        return;
    }

    document.getElementById("selectedFlight").textContent =
        `${currentFlight.name}: ${currentFlight.from} to ${currentFlight.to} | ` +
        `${currentDate} | ${currentClass} | ₹${Math.round(currentFlight.fare * classMultiplier())}`;

    const seatSelect = document.getElementById("seatNumber");
    seatSelect.innerHTML = "";

    for (let i = 1; i <= currentFlight.seats; i++) {
        const option = document.createElement("option");
        option.value = "S" + i;
        option.textContent = "Seat S" + i;
        seatSelect.appendChild(option);
    }

    showPage("booking");
}

document.getElementById("bookingForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!currentUser || !currentFlight || currentFlight.seats < 1) {
        alert("Please log in and select an available flight.");
        showPage("home");
        return;
    }

    const passengerName = document.getElementById("passengerName").value.trim();
    const age = Number(document.getElementById("passengerAge").value);
    const seat = document.getElementById("seatNumber").value;

    const occupied = tickets.some(t =>
        t.flightId === currentFlight.id &&
        t.date === currentDate &&
        t.seat === seat &&
        t.status === "Confirmed"
    );

    if (occupied) {
        alert("This seat has already been booked. Please search again.");
        showPage("home");
        return;
    }

    const user = users.find(u => u.email === currentUser);
    const ticket = {
        pnr: "FL" + Date.now().toString().slice(-8),
        email: currentUser,
        passengerName,
        age,
        flightId: currentFlight.id,
        flightName: currentFlight.name,
        from: currentFlight.from,
        to: currentFlight.to,
        time: currentFlight.time,
        date: currentDate,
        travelClass: currentClass,
        seat,
        fare: Math.round(currentFlight.fare * classMultiplier()),
        payment: document.getElementById("paymentMethod").value,
        status: "Confirmed"
    };

    currentFlight.seats--;
    tickets.push(ticket);
    saveData("airFlights", flights);
    saveData("airTickets", tickets);

    document.getElementById("ticketDetails").innerHTML = `
        <div class="ticket-card">
            <h3>SkyFly Airlines - E-Ticket</h3>
            <p><b>PNR:</b> ${ticket.pnr}</p>
            <p><b>Passenger:</b> ${ticket.passengerName}</p>
            <p><b>Flight:</b> ${ticket.flightName}</p>
            <p><b>Route:</b> ${ticket.from} → ${ticket.to}</p>
            <p><b>Date:</b> ${ticket.date}</p>
            <p><b>Departure:</b> ${ticket.time}</p>
            <p><b>Class:</b> ${ticket.travelClass}</p>
            <p><b>Seat:</b> ${ticket.seat}</p>
            <p><b>Fare:</b> ₹${ticket.fare}</p>
            <p><b>Status:</b> ${ticket.status}</p>
            <p><b>Payment option:</b> ${ticket.payment}</p>
        </div>
    `;

    this.reset();
    showPage("ticket");
});

function showBookings() {
    const list = document.getElementById("bookingHistory");
    list.innerHTML = "";

    if (!currentUser) {
        list.textContent = "Please log in to view your bookings.";
        return;
    }

    const myTickets = tickets.filter(t => t.email === currentUser);

    if (myTickets.length === 0) {
        list.textContent = "No bookings found.";
        return;
    }

    myTickets.forEach(t => {
        const card = document.createElement("div");
        card.className = "booking-card";
        card.innerHTML = `
            <p><b>PNR:</b> ${t.pnr}</p>
            <p>${t.flightName}: ${t.from} → ${t.to}</p>
            <p>Date: ${t.date} | Seat: ${t.seat}</p>
            <p>Status: ${t.status} | Fare: ₹${t.fare}</p>
            <button type="button">View Ticket</button>
        `;
        card.querySelector("button").addEventListener("click", () => {
            document.getElementById("ticketDetails").innerHTML = `
                <div class="ticket-card">
                    <h3>SkyFly Airlines - E-Ticket</h3>
                    <p>PNR: ${t.pnr}</p>
                    <p>Passenger: ${t.passengerName}</p>
                    <p>Flight: ${t.flightName}</p>
                    <p>Route: ${t.from} → ${t.to}</p>
                    <p>Date: ${t.date} | Departure: ${t.time}</p>
                    <p>Class: ${t.travelClass} | Seat: ${t.seat}</p>
                    <p>Fare: ₹${t.fare} | Status: ${t.status}</p>
                </div>`;
            showPage("ticket");
        });
        list.appendChild(card);
    });
}

document.getElementById("pnrForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const pnr = document.getElementById("pnrInput").value.trim().toUpperCase();
    const ticket = tickets.find(t => t.pnr.toUpperCase() === pnr);

    document.getElementById("pnrResult").textContent = ticket
        ? `PNR: ${ticket.pnr} | Flight: ${ticket.flightName} | Status: ${ticket.status}`
        : "PNR not found.";
});

document.getElementById("adminLoginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (document.getElementById("adminUser").value === "admin" &&
        document.getElementById("adminPass").value === "admin123") {
        document.getElementById("adminPanel").classList.remove("hidden");
        refreshAdmin();
        alert("Admin login successful.");
    } else {
        alert("Invalid admin username or password.");
    }
});

document.getElementById("flightForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const flight = {
        id: Date.now(),
        name: document.getElementById("flightName").value.trim(),
        from: document.getElementById("flightFrom").value.trim(),
        to: document.getElementById("flightTo").value.trim(),
        time: document.getElementById("flightTime").value,
        fare: Number(document.getElementById("flightFare").value),
        seats: Number(document.getElementById("flightSeats").value)
    };

    if (flight.from.toLowerCase() === flight.to.toLowerCase()) {
        alert("Source and destination must be different.");
        return;
    }

    flights.push(flight);
    saveData("airFlights", flights);
    this.reset();
    refreshAdmin();
    alert("Flight added successfully.");
});

function refreshAdmin() {
    const flightList = document.getElementById("adminFlights");
    const userList = document.getElementById("adminUsers");

    if (!flightList || !userList) return;

    flightList.innerHTML = "";
    flights.forEach(f => {
        const div = document.createElement("div");
        div.className = "flight-card";
        div.innerHTML = `
            <p><b>${f.name}</b> | ${f.from} → ${f.to}</p>
            <p>Time: ${f.time} | Fare: ₹${f.fare} | Seats: ${f.seats}</p>
            <button type="button">Delete Flight</button>
        `;
        div.querySelector("button").addEventListener("click", () => {
            if (!confirm("Delete this flight?")) return;
            flights = flights.filter(item => item.id !== f.id);
            saveData("airFlights", flights);
            refreshAdmin();
        });
        flightList.appendChild(div);
    });

    userList.innerHTML = users.length
        ? users.map(u => `<p>${u.name} — ${u.email}</p>`).join("")
        : "<p>No registered passengers.</p>";
};
