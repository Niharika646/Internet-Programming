let books = ["Java", "Python", "HTML", "Data Structures"];

function login() {
    let username = prompt("Enter your username:");
    let password = prompt("Enter your password:");

    if (username && password) {
        alert("Welcome, " + username + "!");
    } else {
        alert("Please enter your details.");
    }
}

function register() {
    let name = prompt("Enter your name:");

    if (name) {
        alert("Registration form started for " + name);
    }
}

function searchBook() {
    let name = document.getElementById("search").value.toLowerCase();

    let found = books.filter(book =>
        book.toLowerCase().includes(name)
    );

    document.getElementById("result").textContent =
        found.length ? found.join(", ") : "Book not found";
}

function addBook() {
    let name = document.getElementById("bookName").value.trim();

    if (name === "") {
        alert("Please enter a book name.");
        return;
    }

    books.push(name);

    let item = document.createElement("li");
    item.textContent = name;
    document.getElementById("bookList").appendChild(item);

    alert("Book added successfully!");

    document.getElementById("bookName").value = "";
}

function calculateFine() {
    let days = Number(document.getElementById("days").value);

    if (document.getElementById("days").value === "" || days < 0) {
        alert("Please enter valid late days.");
        return;
    }

    let fine = days * 5;

    document.getElementById("fineResult").textContent =
        "Total Fine: Rs. " + fine;
}