let turn = "X";

function loadButtons() {
    document.querySelector("#b1").addEventListener("click", () => {
        play("#b1")
    });
    document.querySelector("#b2").addEventListener("click", () => {
        play("#b2")
    });
    document.querySelector("#b3").addEventListener("click", () => {
        play("#b3")
    });
    document.querySelector("#b4").addEventListener("click", () => {
        play("#b4")
    });
    document.querySelector("#b5").addEventListener("click", () => {
        play("#b5")
    });
    document.querySelector("#b6").addEventListener("click", () => {
        play("#b6")
    });
    document.querySelector("#b7").addEventListener("click", () => {
        play("#b7")
    });
    document.querySelector("#b8").addEventListener("click", () => {
        play("#b8")
    });
    document.querySelector("#b9").addEventListener("click", () => {
        play("#b9")
    });
}

function play( btn ) {
    let b = (typeof btn === "string" ? document.querySelector(btn) : btn);
    if (b.textContent == "X" || b.textContent == "O") {
        return;
    }
    if (turn == "X") {
        turn = "O";
        document.querySelector(".turn").style.color = "blue";
        (typeof btn === "string" ? document.querySelector(btn) : btn).textContent = "X";
        (typeof btn === "string" ? document.querySelector(btn) : btn).style.color = "RED";
        document.querySelector(".turn").textContent = "Turn: O";
        let winner = checkWinner();
        if (winner) {
            showWinner(winner)
        }
        return;
    }
    if (turn == "O") {
        turn = "X";
        document.querySelector(".turn").style.color = "red";
        (typeof btn === "string" ? document.querySelector(btn) : btn).textContent = "O";
        (typeof btn === "string" ? document.querySelector(btn) : btn).style.color = "BLUE";
        document.querySelector(".turn").textContent = "Turn: X";
        winner = checkWinner();
        if (winner) {
            showWinner(winner)
        }
        return;
    }
}

function checkWinner() {
    let b1 = document.querySelector("#b1");
    let b2 = document.querySelector("#b2");
    let b3 = document.querySelector("#b3");
    let b4 = document.querySelector("#b4");
    let b5 = document.querySelector("#b5");
    let b6 = document.querySelector("#b6");
    let b7 = document.querySelector("#b7");
    let b8 = document.querySelector("#b8");
    let b9 = document.querySelector("#b9");
    if ((b1.textContent == "X" || b1.textContent == "O") && b1.textContent == b2.textContent && b2.textContent == b3.textContent) {
        return b1.textContent + " 🥳";
    }
    if ((b4.textContent == "X" || b4.textContent == "O") && b4.textContent == b5.textContent && b5.textContent == b6.textContent) {
        return b4.textContent + " 🥳";
    }
    if ((b7.textContent == "X" || b7.textContent == "O") && b7.textContent == b8.textContent && b8.textContent == b9.textContent) {
        return b7.textContent + " 🥳";
    }
    if ((b1.textContent == "X" || b1.textContent == "O") && b1.textContent == b4.textContent && b4.textContent == b7.textContent) {
        return b1.textContent + " 🥳";
    }
    if ((b2.textContent == "X" || b2.textContent == "O") && b2.textContent == b5.textContent && b5.textContent == b8.textContent) {
        return b2.textContent + " 🥳";
    }
    if ((b3.textContent == "X" || b3.textContent == "O") && b3.textContent == b6.textContent && b6.textContent == b9.textContent) {
        return b3.textContent + " 🥳";
    }
    if ((b1.textContent == "X" || b1.textContent == "O") && b1.textContent == b5.textContent && b5.textContent == b9.textContent) {
        return b1.textContent + " 🥳";
    }
    if ((b3.textContent == "X" || b3.textContent == "O") && b3.textContent == b5.textContent && b5.textContent == b7.textContent) {
        return b3.textContent + " 🥳";
    }
    if ((b1.textContent == "X" || b1.textContent == "O") && (b2.textContent == "X" || b2.textContent == "O") && 
    (b3.textContent == "X" || b3.textContent == "O") && (b4.textContent == "X" || b4.textContent == "O") && 
    (b5.textContent == "X" || b5.textContent == "O") && (b6.textContent == "X" || b6.textContent == "O") &&
    (b7.textContent == "X" || b7.textContent == "O") && (b8.textContent == "X" || b8.textContent == "O") &&
    (b9.textContent == "X" || b9.textContent == "O")) {
        return "NO Winner "
    }
    return null;
}

function showWinner(winner) {
    document.querySelector("#b1").remove();
    document.querySelector("#b2").remove();
    document.querySelector("#b3").remove();
    document.querySelector("#b4").remove();
    document.querySelector("#b5").remove();
    document.querySelector("#b6").remove();
    document.querySelector("#b7").remove();
    document.querySelector("#b8").remove();
    document.querySelector("#b9").remove();

    document.querySelector("#winner h1").style.backgroundColor = "#000";

    document.querySelector("#winner").innerHTML = `<h1>Winner: ${winner}</h1>
    <button class="restart_btn" onclick="window.location.reload()"> Play Again</button>`;
}
loadButtons()