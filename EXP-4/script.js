
const read = key => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
};

const save = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

let currentUser = null;
let chosenTrain = null;
let trains = read("railTrains");
let users = read("railUsers");
let tickets = read("railTickets");

// INITIAL TRAIN DATA
if (trains.length === 0) {
    trains = [
        { id: 1, number: "12657", name: "Chennai Express",
          from: "Chennai", to: "Bangalore", time: "08:00",
          arrival: "14:00", seats: 20, fare: 500 },
        { id: 2, number: "12658", name: "Tamil Nadu Express",
          from: "Chennai", to: "Hyderabad", time: "19:00",
          arrival: "07:00", seats: 20, fare: 700 },
        { id: 3, number: "12659", name: "Coastal Express",
          from: "Bangalore", to: "Chennai", time: "09:00",
          arrival: "15:00", seats: 15, fare: 450 },
        { id: 4, number: "12660", name: "City Superfast",
          from: "Hyderabad", to: "Chennai", time: "20:00",
          arrival: "08:00", seats: 15, fare: 650 }
    ];
    save("railTrains", trains);
}

// PAGE NAVIGATION
function showPage(id) {
    document.querySelectorAll(".page").forEach(p =>
        p.classList.add("hidden")
    );

    const page = document.getElementById(id);
    if (page) page.classList.remove("hidden");

    if (id === "dashboard") showBookings();
    if (id === "admin") showAdmin();
}

// DATE HELPERS
function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

document.getElementById("journeyDate").min = today();
document.getElementById("bookDate").min = today();

// REGISTRATION
document.getElementById("registerForm").onsubmit = function(e) {
    e.preventDefault();

    users = read("railUsers");

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail")
        .value.trim().toLowerCase();
    const mobile = document.getElementById("regMobile").value.trim();
    const password = document.getElementById("regPassword").value;

    if (users.some(u => u.email === email)) {
        alert("Email already registered. Please login.");
        showPage("userLogin");
        return;
    }

    users.push({ name, email, mobile, password });
    save("railUsers", users);

    alert("Registration successful! Please login.");
    this.reset();
    showPage("userLogin");
};

// USER LOGIN
document.getElementById("userLoginForm").onsubmit = function(e) {
    e.preventDefault();

    const email = document.getElementById("userEmail")
        .value.trim().toLowerCase();
    const password = document.getElementById("userPassword").value;

    users = read("railUsers");

    const user = users.find(u =>
        u.email === email && u.password === password
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

    alert("Welcome, " + user.name + "!");
    this.reset();
    showPage("home");
};

// ADMIN LOGIN
document.getElementById("adminLoginForm").onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "admin123") {
        currentUser = { name: "Admin", role: "admin" };
        alert("Admin login successful!");
        this.reset();
        showPage("admin");
    } else {
        alert("Invalid admin credentials.");
    }
};

// LOGOUT
function logout() {
    currentUser = null;
    chosenTrain = null;
    alert("Logged out successfully.");
    showPage("home");
}

// TRAIN SEARCH
document.getElementById("searchForm").onsubmit = function(e) {
    e.preventDefault();

    const from = document.getElementById("from").value.trim().toLowerCase();
    const to = document.getElementById("to").value.trim().toLowerCase();
    const date = document.getElementById("journeyDate").value;
    const cls = document.getElementById("searchClass").value;

    if (date < today()) {
        alert("Please select today or a future date.");
        return;
    }

    trains = read("railTrains");

    const results = trains.filter(t =>
        t.from.toLowerCase() === from &&
        t.to.toLowerCase() === to
    );

    const container = document.getElementById("trainResults");

    if (!results.length) {
        container.innerHTML = "<p>No trains found for this route.</p>";
        return;
    }

    container.innerHTML = results.map(t => {
        const available = availableSeats(t, date);

        const classes = ["Sleeper", "AC 3 Tier", "AC 2 Tier", "First AC"];

        const classOptions = classes
            .filter(c => cls === "All" || c === cls)
            .map(c => `<option value="${c}">${c} - ₹${fare(t, c)}</option>`)
            .join("");

        return `
            <div class="train-card">
                <h3>${t.number} - ${t.name}</h3>
                <p>${t.from} → ${t.to}</p>
                <p>Departure: ${t.time} | Arrival: ${t.arrival}</p>
                <p>Available seats: ${available}</p>
                <label>Choose class</label>
                <select id="class-${t.id}">${classOptions}</select>
                <button onclick="startBooking(${t.id}, '${date}')">
                    Book Ticket
                </button>
            </div>
        `;
    }).join("");
};

// FARE BY CLASS
function fare(train, cls) {
    const multiplier = {
        "Sleeper": 1,
        "AC 3 Tier": 1.5,
        "AC 2 Tier": 2,
        "First AC": 3
    };

    return Math.round(train.fare * multiplier[cls]);
}

// SEAT AVAILABILITY
function availableSeats(train, date) {
    const booked = read("railTickets")
        .filter(t =>
            t.trainId === train.id &&
            t.date === date &&
            t.status !== "Cancelled" &&
            t.status !== "Waiting List"
        )
        .reduce((sum, t) => sum + t.passengers.length, 0);

    return Math.max(0, train.seats - booked);
}

// OPEN BOOKING FORM
function startBooking(trainId, date) {
    if (!currentUser || currentUser.role !== "user") {
        alert("Please register and login as a user first.");
        showPage("userLogin");
        return;
    }

    chosenTrain = read("railTrains").find(t => t.id === trainId);

    if (!chosenTrain) {
        alert("Train not found.");
        return;
    }

    document.getElementById("selectedTrain").innerHTML = `
        <div class="item-card">
            <h3>${chosenTrain.number} - ${chosenTrain.name}</h3>
            <p>${chosenTrain.from} → ${chosenTrain.to}</p>
            <p>Departure: ${chosenTrain.time}</p>
        </div>
    `;

    document.getElementById("bookDate").value = date;
    document.getElementById("travelClass").value =
        document.getElementById("class-" + trainId).value;

    showPage("bookingPage");
}

// BOOK AND SIMULATE PAYMENT
document.getElementById("bookingForm").onsubmit = function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "user" || !chosenTrain) {
        alert("Please login and select a train.");
        showPage("userLogin");
        return;
    }

    const date = document.getElementById("bookDate").value;
    const name = document.getElementById("passengerName").value.trim();
    const age = Number(document.getElementById("passengerAge").value);
    const gender = document.getElementById("passengerGender").value;
    const count = Number(document.getElementById("ticketCount").value);
    const cls = document.getElementById("travelClass").value;
    const payment = document.getElementById("paymentMode").value;

    if (date < today()) {
        alert("Journey date cannot be in the past.");
        return;
    }

    if (!name || age < 1 || age > 120 || count < 1 || count > 6) {
        alert("Please enter valid passenger details.");
        return;
    }

    const currentTrain = read("railTrains").find(
        t => t.id === chosenTrain.id
    );

    if (!currentTrain) {
        alert("Train is no longer available.");
        return;
    }

    if (count > availableSeats(currentTrain, date)) {
        alert("Not enough confirmed seats. Reduce the ticket count.");
        return;
    }

    const total = fare(currentTrain, cls) * count;

    if (!confirm(
        "Train: " + currentTrain.name +
        "\nPassengers: " + count +
        "\nClass: " + cls +
        "\nPayment: " + payment +
        "\nTotal fare: ₹" + total +
        "\n\nConfirm demo booking?"
    )) {
        return;
    }

    const pnr = String(Date.now()).slice(-10);

    const ticket = {
        pnr,
        trainId: currentTrain.id,
        trainNumber: currentTrain.number,
        trainName: currentTrain.name,
        from: currentTrain.from,
        to: currentTrain.to,
        date,
        time: currentTrain.time,
        arrival: currentTrain.arrival,
        class: cls,
        passengers: Array.from({ length: count }, (_, i) => ({
            name: i === 0 ? name : name + " (Passenger " + (i + 1) + ")",
            age,
            gender
        })),
        email: currentUser.email,
        fare: fare(currentTrain, cls),
        total,
        payment,
        paymentStatus: payment === "Offline" ? "Pay at counter (demo)" : "Demo successful",
        status: "Confirmed",
        created: today()
    };

    const tickets = read("railTickets");
    tickets.push(ticket);
    save("railTickets", tickets);

    alert("Ticket booked!\nYour PNR is " + pnr);

    this.reset();
    showTicket(ticket);
};

// SHOW / PRINT TICKET
function showTicket(t) {
    document.getElementById("ticketDetails").innerHTML = `
        <div class="ticket-card">
            <h3 class="success">Railway Ticket ${t.status}</h3>
            <p><b>PNR:</b> ${t.pnr}</p>
            <p><b>Train:</b> ${t.trainNumber} - ${t.trainName}</p>
            <p><b>Route:</b> ${t.from} → ${t.to}</p>
            <p><b>Date:</b> ${t.date}</p>
            <p><b>Departure:</b> ${t.time} | <b>Arrival:</b> ${t.arrival}</p>
            <p><b>Class:</b> ${t.class}</p>
            <p><b>Passengers:</b> ${t.passengers.map(p => p.name).join(", ")}</p>
            <p><b>Fare:</b> ₹${t.total}</p>
            <p><b>Payment:</b> ${t.paymentStatus}</p>
            <p><b>Status:</b> ${t.status}</p>
        </div>
    `;

    showPage("ticketPage");
}

// BOOKING HISTORY
function showBookings() {
    const container = document.getElementById("bookingList");

    if (!currentUser) {
        container.innerHTML = "<p>Please login to view bookings.</p>";
        return;
    }

    const tickets = read("railTickets").filter(t =>
        currentUser.role === "admin" || t.email === currentUser.email
    );

    if (!tickets.length) {
        container.innerHTML = "<p>No booking history found.</p>";
        return;
    }

    container.innerHTML = tickets.map(t => `
        <div class="item-card">
            <h3>${t.trainName}</h3>
            <p>PNR: ${t.pnr}</p>
            <p>${t.from} → ${t.to} | Date: ${t.date}</p>
            <p>Class: ${t.class} | Fare: ₹${t.total}</p>
            <p>Status: ${t.status}</p>
            <button onclick="viewTicket('${t.pnr}')">View / Print Ticket</button>
        </div>
    `).join("");
}

function viewTicket(pnr) {
    const ticket = read("railTickets").find(t => t.pnr === pnr);

    if (!ticket) {
        alert("Ticket not found.");
        return;
    }

    if (currentUser.role !== "admin" &&
        ticket.email !== currentUser.email) {
        alert("You cannot view another user's ticket.");
        return;
    }

    showTicket(ticket);
}

// PNR STATUS
document.getElementById("pnrForm").onsubmit = function(e) {
    e.preventDefault();

    const pnr = document.getElementById("pnrInput").value.trim();
    const ticket = read("railTickets").find(t => t.pnr === pnr);
    const result = document.getElementById("pnrResult");

    if (!ticket) {
        result.innerHTML = "<p>PNR not found.</p>";
        return;
    }

    result.innerHTML = `
        <div class="item-card">
            <h3>PNR Status</h3>
            <p>PNR: ${ticket.pnr}</p>
            <p>Train: ${ticket.trainName}</p>
            <p>Journey Date: ${ticket.date}</p>
            <p>Status: <b>${ticket.status}</b></p>
        </div>
    `;
};

// CANCELLATION: LOOK UP TICKET
document.getElementById("cancelForm").onsubmit = function(e) {
    e.preventDefault();

    const pnr = document.getElementById("cancelPnr").value.trim();
    const ticket = read("railTickets").find(t => t.pnr === pnr);
    const result = document.getElementById("cancelResult");

    if (!ticket) {
        result.innerHTML = "<p>PNR not found.</p>";
        return;
    }

    if (!currentUser ||
        (currentUser.role !== "admin" && ticket.email !== currentUser.email)) {
        result.innerHTML = "<p>Please login with the account that booked this ticket.</p>";
        return;
    }

    const days = Math.floor(
        (new Date(ticket.date + "T00:00:00") -
         new Date(today() + "T00:00:00")) / 86400000
    );

    const percent = days > 2 ? 90 : days >= 1 ? 70 : 50;
    const refund = ticket.status === "Confirmed"
        ? Math.round(ticket.total * percent / 100)
        : 0;

    result.innerHTML = `
        <div class="item-card">
            <h3>${ticket.trainName}</h3>
            <p>PNR: ${ticket.pnr}</p>
            <p>Journey Date: ${ticket.date}</p>
            <p>Ticket Fare: ₹${ticket.total}</p>
            <p>Demo refund rate: ${percent}%</p>
            <p>Estimated refund: ₹${refund}</p>
            <p>Status: ${ticket.status}</p>
            ${ticket.status === "Confirmed"
                ? `<button onclick="cancelTicket('${ticket.pnr}', ${refund})">
                    Confirm Cancellation
                   </button>`
                : ""}
        </div>
    `;
};

// CANCEL AND RECORD REFUND
function cancelTicket(pnr, refund) {
    let tickets = read("railTickets");
    const ticket = tickets.find(t => t.pnr === pnr);

    if (!ticket || ticket.status !== "Confirmed") {
        alert("Ticket not found or already cancelled.");
        return;
    }

    if (!currentUser ||
        (currentUser.role !== "admin" && ticket.email !== currentUser.email)) {
        alert("Access denied.");
        return;
    }

    if (!confirm("Cancel ticket and record refund of ₹" + refund + "?")) {
        return;
    }

    ticket.status = "Cancelled";
    ticket.refund = refund;
    ticket.refundStatus = "Refund recorded (demo)";

    save("railTickets", tickets);

    alert("Ticket cancelled. Recorded refund: ₹" + refund);
    document.getElementById("cancelResult").innerHTML =
        `<p class="success">Ticket cancelled. Refund recorded: ₹${refund}</p>`;
}

// ADMIN PANEL
function showAdmin() {
    const controls = document.getElementById("adminControls");
    const status = document.getElementById("adminStatus");

    if (!currentUser || currentUser.role !== "admin") {
        controls.classList.add("hidden");
        status.textContent = "Please login as admin.";
        return;
    }

    controls.classList.remove("hidden");
    status.textContent = "Admin logged in successfully.";

    showAdminTrains();
    showAdminUsers();
}

// ADD / UPDATE TRAIN
document.getElementById("trainForm").onsubmit = function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    const id = document.getElementById("trainId").value;

    const train = {
        id: id ? Number(id) : Date.now(),
        name: document.getElementById("trainName").value.trim(),
        number: document.getElementById("trainNumber").value.trim(),
        from: document.getElementById("trainFrom").value.trim(),
        to: document.getElementById("trainTo").value.trim(),
        time: document.getElementById("trainTime").value,
        arrival: document.getElementById("arrivalTime").value,
        seats: Number(document.getElementById("trainSeats").value),
        fare: Number(document.getElementById("trainFare").value)
    };

    trains = read("railTrains");

    if (id) {
        const old = trains.find(t => t.id === Number(id));

        if (old && train.seats < old.seats) {
            const booked = read("railTickets").some(t =>
                t.trainId === old.id &&
                t.status === "Confirmed" &&
                t.passengers.length > train.seats
            );

            if (booked) {
                alert("Cannot reduce seats below existing bookings.");
                return;
            }
        }

        trains = trains.map(t => t.id === Number(id) ? train : t);
    } else {
        trains.push(train);
    }

    save("railTrains", trains);
    this.reset();
    document.getElementById("trainId").value = "";

    alert("Train saved successfully.");
    showAdminTrains();
};

// ADMIN TRAIN LIST
function showAdminTrains() {
    trains = read("railTrains");

    document.getElementById("adminTrainList").innerHTML =
        trains.map(t => `
            <div class="item-card">
                <b>${t.number} - ${t.name}</b>
                <p>${t.from} → ${t.to}</p>
                <p>${t.time} - ${t.arrival}</p>
                <p>Seats: ${t.seats} | Base fare: ₹${t.fare}</p>
                <button onclick="editTrain(${t.id})">Edit</button>
                <button onclick="deleteTrain(${t.id})">Delete</button>
            </div>
        `).join("");
}

// EDIT TRAIN
function editTrain(id) {
    if (!currentUser || currentUser.role !== "admin") return;

    const t = read("railTrains").find(t => t.id === id);
    if (!t) return;

    document.getElementById("trainId").value = t.id;
    document.getElementById("trainName").value = t.name;
    document.getElementById("trainNumber").value = t.number;
    document.getElementById("trainFrom").value = t.from;
    document.getElementById("trainTo").value = t.to;
    document.getElementById("trainTime").value = t.time;
    document.getElementById("arrivalTime").value = t.arrival;
    document.getElementById("trainSeats").value = t.seats;
    document.getElementById("trainFare").value = t.fare;

    document.getElementById("trainForm").scrollIntoView({
        behavior: "smooth"
    });
}

// DELETE TRAIN
function deleteTrain(id) {
    if (!currentUser || currentUser.role !== "admin") return;

    if (!confirm("Delete this train?")) return;

    trains = read("railTrains");
    trains = trains.filter(t => t.id !== id);
    save("railTrains", trains);

    alert("Train deleted.");
    showAdminTrains();
}

// REGISTERED USERS
function showAdminUsers() {
    users = read("railUsers");

    document.getElementById("adminUserList").innerHTML =
        users.length
        ? users.map(u => `
            <div class="item-card">
                <b>${u.name}</b>
                <p>Email: ${u.email}</p>
                <p>Mobile: ${u.mobile}</p>
            </div>
        `).join("")
        : "<p>No registered users.</p>";
}

// REPORT
function generateReport() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    const allTrains = read("railTrains");
    const allUsers = read("railUsers");
    const allTickets = read("railTickets");

    const active = allTickets.filter(t => t.status === "Confirmed");
    const cancelled = allTickets.filter(t => t.status === "Cancelled");
    const revenue = active.reduce((sum, t) => sum + t.total, 0);
    const refunds = cancelled.reduce((sum, t) => sum + (t.refund || 0), 0);

    document.getElementById("report").innerHTML = `
        <div class="item-card">
            <h3>Railway Booking Report</h3>
            <p>Total Trains: ${allTrains.length}</p>
            <p>Registered Users: ${allUsers.length}</p>
            <p>Total Tickets: ${allTickets.length}</p>
            <p>Confirmed Tickets: ${active.length}</p>
            <p>Cancelled Tickets: ${cancelled.length}</p>
            <p>Confirmed Booking Value: ₹${revenue}</p>
            <p>Refunds Recorded: ₹${refunds}</p>
        </div>
    `;
}

// DOWNLOAD CSV REPORT
function downloadReport() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Admin login required.");
        return;
    }

    const tickets = read("railTickets");

    const rows = [
        ["PNR", "Train", "Passenger", "Email", "Date",
         "Class", "Fare", "Payment", "Status", "Refund"],
        ...tickets.map(t => [
            t.pnr,
            t.trainName,
            t.passengers.map(p => p.name).join("; "),
            t.email,
            t.date,
            t.class,
            t.total,
            t.paymentStatus,
            t.status,
            t.refund || 0
        ])
    ];

    const csv = rows.map(row =>
        row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "railway_report.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// START WEBSITE
showPage("home");