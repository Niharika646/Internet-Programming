let rooms = JSON.parse(localStorage.getItem("rooms")) || [
    {id: 1, name: "Standard Room", price: 2000, quantity: 8, image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600", amenities: "Wi-Fi, AC, Queen Bed"},
    {id: 2, name: "Deluxe Room", price: 3500, quantity: 6, image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600", amenities: "Wi-Fi, AC, TV"},
    {id: 3, name: "Executive Suite", price: 5000, quantity: 4, image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600", amenities: "King Bed, Wi-Fi, Mini Bar"},
    {id: 4, name: "Family Room", price: 4500, quantity: 5, image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600", amenities: "Family Beds, AC, Wi-Fi"}
];

let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let isAdmin = false;
let search = null;

function saveData() {
    localStorage.setItem("rooms", JSON.stringify(rooms));
    localStorage.setItem("bookings", JSON.stringify(bookings));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function renderRooms() {
    document.getElementById("roomList").innerHTML = rooms.map(room => `
        <div class="room-card">
            <img src="${room.image}" alt="${room.name}">
            <div class="content">
                <h3>${room.name}</h3>
                <p>${room.amenities}</p>
                <p class="price">₹${room.price} / night</p>
                <p>Rooms available: ${search ? availableRooms(room.id, search.in, search.out) : room.quantity}</p>
                <button onclick="bookRoom(${room.id})">Book Now</button>
            </div>
        </div>
    `).join("");
}

function searchRooms() {
    const destination = document.getElementById("destination").value.trim();
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;

    if (!destination || !checkin || !checkout ||
        checkin < new Date().toLocaleDateString("en-CA") ||
        checkout <= checkin) {
        alert("Enter a destination and valid check-in/check-out dates.");
        return;
    }

    search = {destination, in: checkin, out: checkout};
    renderRooms();
    alert("Room availability checked for " + destination);
}

function availableRooms(roomId, checkin, checkout, excludeId = null) {
    const room = rooms.find(r => r.id === roomId);
    const occupied = bookings.filter(b =>
        b.roomId === roomId &&
        b.status === "Confirmed" &&
        b.id !== excludeId &&
        checkin < b.checkout &&
        checkout > b.checkin
    ).length;

    return Math.max(0, room.quantity - occupied);
}

function registerUser() {
    const name = prompt("Enter your full name:");
    if (!name) return;

    const email = prompt("Enter your email:")?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
        alert("Enter a valid email.");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some(u => u.email === email)) {
        alert("Account already exists. Please log in.");
        return;
    }

    const password = prompt("Create a password:");
    if (!password) return;

    users.push({name, email, password});
    localStorage.setItem("users", JSON.stringify(users));
    currentUser = {name, email};
    saveData();
    updateBookings();
    alert("Registration successful!");
}

function loginUser() {
    const email = prompt("Enter your email:")?.trim().toLowerCase();
    const password = prompt("Enter your password:");
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert("Incorrect details. Please register first.");
        return;
    }

    currentUser = {name: user.name, email: user.email};
    saveData();
    updateBookings();
    alert("Login successful! Welcome " + user.name);
}

function bookRoom(roomId) {
    if (!search) {
        alert("Please search with your destination and dates first.");
        return;
    }

    if (!currentUser) {
        alert("Please register or log in before booking.");
        return;
    }

    const room = rooms.find(r => r.id === roomId);
    const available = availableRooms(roomId, search.in, search.out);

    if (available <= 0) {
        alert("Sorry, no rooms are available for these dates.");
        return;
    }

    const nights = (new Date(search.out) - new Date(search.in)) / 86400000;
    const guests = Number(document.getElementById("guests").value);
    const id = Date.now();

    const booking = {
        id, roomId, roomName: room.name,
        guestName: currentUser.name,
        email: currentUser.email,
        checkin: search.in,
        checkout: search.out,
        guests, nights,
        total: nights * room.price,
        status: "Confirmed"
    };

    if (confirm(`Book ${room.name} for ${nights} night(s)?\nTotal: ₹${booking.total}`)) {
        bookings.push(booking);
        saveData();
        renderRooms();
        updateBookings();
        alert("Booking confirmed! Booking ID: " + id);
    }
}

function updateBookings() {
    const list = document.getElementById("bookingList");

    if (!currentUser) {
        list.innerHTML = "Please log in to view bookings.";
        return;
    }

    const mine = bookings.filter(b => b.email === currentUser.email);

    list.innerHTML = mine.length ? mine.map(b => `
        <div class="booking-card">
            <div>
                <h3>${b.roomName}</h3>
                <p>Booking ID: ${b.id}</p>
                <p>${b.checkin} to ${b.checkout}</p>
                <p>Total: ₹${b.total} | Status: ${b.status}</p>
            </div>
            <div>
                <button onclick="modifyBooking(${b.id})">Modify</button>
                <button onclick="cancelBooking(${b.id})">Cancel</button>
                <button onclick="reviewBooking(${b.id})">Review</button>
            </div>
        </div>
    `).join("") : "No bookings found.";
}

function modifyBooking(id) {
    const b = bookings.find(b => b.id === id);
    if (!b || b.status !== "Confirmed") return;

    if (daysUntil(b.checkin) < 3) {
        alert("Bookings can only be modified at least 3 days before arrival.");
        return;
    }

    const checkin = prompt("New check-in date (YYYY-MM-DD):", b.checkin);
    const checkout = prompt("New check-out date (YYYY-MM-DD):", b.checkout);

    if (!checkin || !checkout || checkin < new Date().toLocaleDateString("en-CA") ||
        checkout <= checkin) {
        alert("Invalid dates.");
        return;
    }

    if (availableRooms(b.roomId, checkin, checkout, b.id) <= 0) {
        alert("No rooms available for those dates.");
        return;
    }

    const nights = (new Date(checkout) - new Date(checkin)) / 86400000;
    b.checkin = checkin;
    b.checkout = checkout;
    b.nights = nights;
    b.total = nights * rooms.find(r => r.id === b.roomId).price;

    saveData();
    renderRooms();
    updateBookings();
    alert("Booking updated!");
}

function cancelBooking(id) {
    const b = bookings.find(b => b.id === id);
    if (!b || b.status !== "Confirmed") return;

    if (daysUntil(b.checkin) < 3) {
        alert("Bookings can only be cancelled at least 3 days before arrival.");
        return;
    }

    if (confirm("Are you sure you want to cancel this booking?")) {
        b.status = "Cancelled";
        saveData();
        renderRooms();
        updateBookings();
        if (isAdmin) renderAdmin();
        alert("Booking cancelled.");
    }
}

function daysUntil(date) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Math.floor((new Date(date + "T00:00:00") - start) / 86400000);
}

function reviewBooking(id) {
    const b = bookings.find(b => b.id === id);
    if (!b || b.status !== "Confirmed") return;

    const rating = prompt("Give a rating from 1 to 5:");
    if (rating === null) return;

    if (!/^[1-5]$/.test(rating)) {
        alert("Rating must be between 1 and 5.");
        return;
    }

    const review = prompt("Write your review:");
    if (review === null) return;

    b.review = {rating: Number(rating), text: review};
    saveData();
    alert("Thank you for your review!");
}

function adminLogin() {
    const username = prompt("Admin username:");
    const password = prompt("Admin password:");

    if (username === "admin" && password === "admin123") {
        isAdmin = true;
        document.getElementById("adminPanel").style.display = "block";
        renderAdmin();
    } else {
        alert("Invalid admin credentials.");
    }
}

function renderAdmin() {
    document.getElementById("adminRooms").innerHTML = rooms.map(r => `
        <div class="booking-card">
            <strong>${r.name}</strong>
            <label>Price: ₹<input type="number" id="price${r.id}" value="${r.price}" min="1"></label>
            <label>Quantity: <input type="number" id="qty${r.id}" value="${r.quantity}" min="0"></label>
            <button onclick="saveRoom(${r.id})">Save</button>
        </div>
    `).join("");

    document.getElementById("allBookings").innerHTML = bookings.length
        ? bookings.map(b => `
            <div class="booking-card">
                <div>
                    <strong>${b.roomName}</strong>
                    <p>${b.guestName} | ${b.email}</p>
                    <p>${b.checkin} to ${b.checkout} | ₹${b.total} | ${b.status}</p>
                </div>
                <button onclick="adminEdit(${b.id})">Edit</button>
                <button onclick="adminCancel(${b.id})">Cancel</button>
            </div>
        `).join("")
        : "No bookings yet.";
}

function saveRoom(id) {
    const room = rooms.find(r => r.id === id);
    const price = Number(document.getElementById("price" + id).value);
    const quantity = Number(document.getElementById("qty" + id).value);

    if (!Number.isFinite(price) || price < 1 ||
        !Number.isInteger(quantity) || quantity < 0) {
        alert("Enter a valid price and quantity.");
        return;
    }

    room.price = price;
    room.quantity = quantity;
    saveData();
    renderRooms();
    renderAdmin();
    alert("Room details updated.");
}

function adminEdit(id) {
    const b = bookings.find(b => b.id === id);
    const roomId = Number(prompt("Enter room ID (1-4):", b.roomId));
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        alert("Invalid room ID.");
        return;
    }

    const checkin = prompt("Check-in date (YYYY-MM-DD):", b.checkin);
    const checkout = prompt("Check-out date (YYYY-MM-DD):", b.checkout);

    if (!checkin || !checkout || checkin < new Date().toLocaleDateString("en-CA") ||
        checkout <= checkin || availableRooms(roomId, checkin, checkout, id) <= 0) {
        alert("Invalid dates or no availability.");
        return;
    }

    b.roomId = roomId;
    b.roomName = room.name;
    b.checkin = checkin;
    b.checkout = checkout;
    b.nights = (new Date(checkout) - new Date(checkin)) / 86400000;
    b.total = b.nights * room.price;

    saveData();
    renderRooms();
    renderAdmin();
    updateBookings();
    alert("Booking details updated.");
}

function adminCancel(id) {
    if (!isAdmin) return;
    const b = bookings.find(b => b.id === id);
    if (b && confirm("Administrator: cancel this booking?")) {
        b.status = "Cancelled";
        saveData();
        renderAdmin();
        renderRooms();
        updateBookings();
        alert("Booking cancelled by administrator.");
    }
}

renderRooms();
updateBookings();
