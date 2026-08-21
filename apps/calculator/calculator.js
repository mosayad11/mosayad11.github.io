/* =========================================================
   MOSAYAD SCIENTIFIC CALCULATOR
   CASIO-STYLE SCIENTIFIC CALCULATOR
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const expressionDisplay =
    document.getElementById("expression-display");

const resultDisplay =
    document.getElementById("result-display");

const shiftIndicator =
    document.getElementById("shift-indicator");

const alphaIndicator =
    document.getElementById("alpha-indicator");

const angleModeDisplay =
    document.getElementById("angle-mode");

const memoryIndicator =
    document.getElementById("memory-indicator");

const themeButton =
    document.getElementById("theme-btn");

const modeMenu =
    document.getElementById("mode-menu");

const equationPanel =
    document.getElementById("equation-panel");

const tablePanel =
    document.getElementById("table-panel");

const historyPanel =
    document.getElementById("history-panel");

const equationInputs =
    document.getElementById("equation-inputs");

const equationResult =
    document.getElementById("equation-result");

const tableResult =
    document.getElementById("table-result");

const historyList =
    document.getElementById("history-list");


/* =========================================================
   CALCULATOR STATE
   ========================================================= */

let expression = "";

let answer = 0;

let memory =
    Number(
        localStorage.getItem("mosayadCalcMemory")
    ) || 0;

let angleMode =
    localStorage.getItem("mosayadCalcAngle") ||
    "DEG";

let shiftMode = false;

let alphaMode = false;

let currentMode = "calculate";

let lastResult = 0;

let equationType = "linear";

/* =========================================================
   HISTORY
   ========================================================= */

let history = [];

try {

    history =
        JSON.parse(
            localStorage.getItem(
                "mosayadCalculatorHistory"
            )
        ) || [];

} catch {

    history = [];

}


/* =========================================================
   INITIALIZE
   ========================================================= */

updateDisplay();

updateIndicators();

renderHistory();

setupEquationInputs();

applySavedTheme();


/* =========================================================
   BUTTON HANDLER
   ========================================================= */

document
    .querySelectorAll(".calc-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;

                const value =
                    button.dataset.value;


                if (value !== undefined) {

                    handleValue(value);

                    return;

                }


                if (action) {

                    handleAction(action);

                }

            }
        );

    });


/* =========================================================
   MODE BUTTONS
   ========================================================= */

document
    .querySelectorAll(".mode-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;


                if (action === "shift") {

                    toggleShift();

                }

                else if (action === "alpha") {

                    toggleAlpha();

                }

                else if (action === "mode") {

                    toggleMenu();

                }

                else if (action === "setup") {

                    openSetup();

                }

            }
        );

    });


/* =========================================================
   MODE MENU
   ========================================================= */

document
    .querySelectorAll(".menu-option")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const mode =
                    button.dataset.mode;

                selectMode(mode);

            }
        );

    });


document
    .querySelectorAll("[data-close-menu]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.closeMenu;

                const element =
                    document.getElementById(id);

                if (element) {

                    element.classList.add("hidden");

                }

            }
        );

    });


/* =========================================================
   PANEL CLOSE
   ========================================================= */

document
    .querySelectorAll("[data-close-panel]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    button.dataset.closePanel;

                const panel =
                    document.getElementById(id);

                if (panel) {

                    panel.classList.add("hidden");

                }

            }
        );

    });


/* =========================================================
   VALUE INPUT
   ========================================================= */

function handleValue(value) {

    if (value === "÷") {

        appendExpression("/");

        return;

    }


    if (value === "×") {

        appendExpression("*");

        return;

    }


    if (value === "−") {

        appendExpression("-");

        return;

    }


    appendExpression(value);

}


/* =========================================================
   ACTION HANDLER
   ========================================================= */

function handleAction(action) {

    switch (action) {


        /* -------------------------------------------------
           CLEAR
        ------------------------------------------------- */

        case "clear":

            expression = "";

            resultDisplay.textContent = "0";

            expressionDisplay.textContent = "";

            break;



        /* -------------------------------------------------
           DELETE
        ------------------------------------------------- */

        case "delete":

            expression =
                expression.slice(
                    0,
                    -1
                );

            updateDisplay();

            break;



        /* -------------------------------------------------
           SHIFT
        ------------------------------------------------- */

        case "shift":

            toggleShift();

            break;



        /* -------------------------------------------------
           ALPHA
        ------------------------------------------------- */

        case "alpha":

            toggleAlpha();

            break;



        /* -------------------------------------------------
           SIN
        ------------------------------------------------- */

        case "sin":

            appendFunction(
                shiftMode
                    ? "asin("
                    : "sin("
            );

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           COS
        ------------------------------------------------- */

        case "cos":

            appendFunction(
                shiftMode
                    ? "acos("
                    : "cos("
            );

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           TAN
        ------------------------------------------------- */

        case "tan":

            appendFunction(
                shiftMode
                    ? "atan("
                    : "tan("
            );

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           LOG
        ------------------------------------------------- */

        case "log":

            appendFunction(
                shiftMode
                    ? "pow10("
                    : "log("
            );

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           LN
        ------------------------------------------------- */

        case "ln":

            appendFunction(
                shiftMode
                    ? "exp("
                    : "ln("
            );

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           SQRT
        ------------------------------------------------- */

        case "sqrt":

            appendFunction(
                shiftMode
                    ? "cbrt("
                    : "sqrt("
            );

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           SQUARE
        ------------------------------------------------- */

        case "square":

            if (shiftMode) {

                appendExpression("^3");

            } else {

                appendExpression("^2");

            }

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           POWER
        ------------------------------------------------- */

        case "power":

            if (shiftMode) {

                appendFunction("nthroot(");

            } else {

                appendExpression("^");

            }

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           INVERSE POWER
        ------------------------------------------------- */

        case "inverse-power":

            if (shiftMode) {

                appendExpression("%");

            } else {

                appendExpression("^-1");

            }

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           FACTORIAL
        ------------------------------------------------- */

        case "factorial":

            if (shiftMode) {

                appendExpression("%");

            } else {

                appendExpression("!");

            }

            shiftMode = false;

            updateIndicators();

            break;



        /* -------------------------------------------------
           PI
        ------------------------------------------------- */

        case "pi":

            appendExpression("π");

            break;



        /* -------------------------------------------------
           E
        ------------------------------------------------- */

        case "e":

            appendExpression("e");

            break;



        /* -------------------------------------------------
           PARENTHESES
        ------------------------------------------------- */

        case "open-parenthesis":

            appendExpression("(");

            break;


        case "close-parenthesis":

            appendExpression(")");

            break;



        /* -------------------------------------------------
           PERCENT
        ------------------------------------------------- */

        case "percent":

            appendExpression("%");

            break;



        /* -------------------------------------------------
           EXP
        ------------------------------------------------- */

        case "exp":

            appendExpression("E");

            break;



        /* -------------------------------------------------
           NEGATIVE
        ------------------------------------------------- */

        case "negative":

            appendExpression("(-");

            break;



        /* -------------------------------------------------
           ANSWER
        ------------------------------------------------- */

        case "ans":

            appendExpression("Ans");

            break;



        /* -------------------------------------------------
           FRACTION
        ------------------------------------------------- */

        case "fraction":

            appendExpression("/");

            break;



        /* -------------------------------------------------
           EQUALS
        ------------------------------------------------- */

        case "equals":

            calculate();

            break;



        /* -------------------------------------------------
           REPLAY LEFT
        ------------------------------------------------- */

        case "replay-left":

            moveCursorLike(-1);

            break;



        /* -------------------------------------------------
           REPLAY RIGHT
        ------------------------------------------------- */

        case "replay-right":

            moveCursorLike(1);

            break;



        /* -------------------------------------------------
           MEMORY
        ------------------------------------------------- */

        case "memory-clear":

            memory = 0;

            saveMemory();

            updateIndicators();

            break;


        case "memory-recall":

            appendExpression(
                formatNumber(memory)
            );

            break;


        case "memory-plus":

            memory += getCurrentValue();

            saveMemory();

            updateIndicators();

            break;


        case "memory-minus":

            memory -= getCurrentValue();

            saveMemory();

            updateIndicators();

            break;



        /* -------------------------------------------------
           HISTORY
        ------------------------------------------------- */

        case "history":

            openPanel(historyPanel);

            break;



        /* -------------------------------------------------
           ANGLE
        ------------------------------------------------- */

        case "angle":

            cycleAngleMode();

            break;



        /* -------------------------------------------------
           SETUP
        ------------------------------------------------- */

        case "setup":

            openSetup();

            break;

    }

}


/* =========================================================
   APPEND EXPRESSION
   ========================================================= */

function appendExpression(value) {

    expression += value;

    updateDisplay();

}


/* =========================================================
   APPEND FUNCTION
   ========================================================= */

function appendFunction(name) {

    expression += name;

    updateDisplay();

}


/* =========================================================
   DISPLAY
   ========================================================= */

function updateDisplay() {

    expressionDisplay.textContent =
        expression
            .replaceAll("*", "×")
            .replaceAll("/", "÷")
            .replaceAll("-", "−");

}


/* =========================================================
   CALCULATE
   ========================================================= */

function calculate() {

    if (!expression.trim()) {

        return;

    }


    try {

        const original =
            expression;


        const value =
            evaluateExpression(
                expression
            );


        if (!Number.isFinite(value)) {

            throw new Error(
                "Math error"
            );

        }


        lastResult = value;

        answer = value;


        resultDisplay.textContent =
            formatNumber(value);


        addHistory(
            original,
            value
        );


        expression =
            formatNumber(value);


    }

    catch (error) {

        console.error(error);

        resultDisplay.textContent =
            "Math ERROR";

    }

}


/* =========================================================
   EXPRESSION EVALUATOR
   ========================================================= */

function evaluateExpression(input) {

    let expr =
        input
            .replaceAll("π", "PI")
            .replaceAll("Ans", "ANS")
            .replaceAll("×", "*")
            .replaceAll("÷", "/")
            .replaceAll("−", "-");


    /* E notation */

    expr =
        expr.replace(
            /(\d+(?:\.\d+)?)E([+-]?\d+)/gi,
            "($1*10^($2))"
        );


    /* CONSTANTS */

    expr =
        expr.replace(
            /\bPI\b/g,
            "Math.PI"
        );


    expr =
        expr.replace(
            /\bANS\b/g,
            `(${answer})`
        );


    expr =
        expr.replace(
            /\be\b/g,
            "Math.E"
        );


    /* FUNCTIONS */

    expr =
        expr.replace(
            /\bsin\(/g,
            "sin("
        );


    expr =
        expr.replace(
            /\bcos\(/g,
            "cos("
        );


    expr =
        expr.replace(
            /\btan\(/g,
            "tan("
        );


    expr =
        expr.replace(
            /\basin\(/g,
            "asin("
        );


    expr =
        expr.replace(
            /\bacos\(/g,
            "acos("
        );


    expr =
        expr.replace(
            /\batan\(/g,
            "atan("
        );


    expr =
        expr.replace(
            /\blog\(/g,
            "Math.log10("
        );


    expr =
        expr.replace(
            /\bln\(/g,
            "Math.log("
        );


    expr =
        expr.replace(
            /\bsqrt\(/g,
            "Math.sqrt("
        );


    expr =
        expr.replace(
            /\bcbrt\(/g,
            "Math.cbrt("
        );


    expr =
        expr.replace(
            /\bpow10\(/g,
            "pow10("
        );


    expr =
        expr.replace(
            /\bexp\(/g,
            "Math.exp("
        );


    expr =
        expr.replace(
            /\bnthroot\(/g,
            "nthroot("
        );


    /* POWER */

    expr =
        convertPowers(expr);


    /* FACTORIAL */

    expr =
        convertFactorials(expr);


    /* PERCENT */

    expr =
        convertPercent(expr);


    /*
       Allowed characters only.
       This prevents arbitrary JavaScript
       from being executed.
    */

    if (
        !/^[0-9+\-*/%().,\sA-Za-z_]+$/.test(
            expr
        )
    ) {

        throw new Error(
            "Invalid expression"
        );

    }


    const fn =
        new Function(
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "pow10",
            "nthroot",
            `
            "use strict";
            return (${expr});
            `
        );


    return fn(
        angleSin,
        angleCos,
        angleTan,
        angleAsin,
        angleAcos,
        angleAtan,
        x => Math.pow(10, x),
        nthRoot
    );

}


/* =========================================================
   POWER CONVERSION
   ========================================================= */

function convertPowers(expr) {

    let previous;

    do {

        previous = expr;


        /*
           Converts:

           2^3
           2^(3+1)

           into:

           Math.pow(2,3)
        */

        expr =
            expr.replace(
                /(\([^()]*\)|Math\.PI|Math\.E|\d+(?:\.\d+)?)(\^)(\([^()]*\)|\d+(?:\.\d+)?)/g,
                "Math.pow($1,$3)"
            );


    } while (
        expr !== previous
    );


    return expr;

}


/* =========================================================
   FACTORIAL CONVERSION
   ========================================================= */

function convertFactorials(expr) {

    let previous;

    do {

        previous = expr;


        expr =
            expr.replace(
                /(\([^()]*\)|Math\.PI|Math\.E|\d+(?:\.\d+)?)!/g,
                "factorial($1)"
            );


    } while (
        expr !== previous
    );


    /*
       Add factorial function to expression
    */

    if (
        expr.includes("factorial(")
    ) {

        expr =
            `
            (() => {
                const factorial = ${factorial.toString()};
                return ${expr};
            })()
            `;

    }


    return expr;

}


/* =========================================================
   PERCENT CONVERSION
   ========================================================= */

function convertPercent(expr) {

    /*
       Simple Casio-style percentage:

       50% -> 0.5
    */

    expr =
        expr.replace(
            /(\([^()]*\)|\d+(?:\.\d+)?)%/g,
            "($1/100)"
        );


    return expr;

}


/* =========================================================
   FACTORIAL
   ========================================================= */

function factorial(n) {

    if (!Number.isFinite(n)) {

        throw new Error(
            "Invalid factorial"
        );

    }


    if (n < 0) {

        throw new Error(
            "Invalid factorial"
        );

    }


    if (n === 0 || n === 1) {

        return 1;

    }


    if (!Number.isInteger(n)) {

        return gamma(n + 1);

    }


    let result = 1;


    for (
        let i = 2;
        i <= n;
        i++
    ) {

        result *= i;

    }


    return result;

}


/* =========================================================
   GAMMA
   ========================================================= */

function gamma(z) {

    const coefficients = [

        676.5203681218851,

        -1259.1392167224028,

        771.32342877765313,

        -176.61502916214059,

        12.507343278686905,

        -0.13857109526572012,

        9.9843695780195716e-6,

        1.5056327351493116e-7

    ];


    if (z < 0.5) {

        return (
            Math.PI /
            (
                Math.sin(Math.PI * z) *
                gamma(1 - z)
            )
        );

    }


    z -= 1;

    let x = 0.99999999999980993;


    for (
        let i = 0;
        i < coefficients.length;
        i++
    ) {

        x +=
            coefficients[i] /
            (z + i + 1);

    }


    const t =
        z +
        coefficients.length -
        0.5;


    return (
        Math.sqrt(2 * Math.PI) *
        Math.pow(t, z + 0.5) *
        Math.exp(-t) *
        x
    );

}


/* =========================================================
   NTH ROOT
   ========================================================= */

function nthRoot(x, n) {

    return Math.pow(
        x,
        1 / n
    );

}


/* =========================================================
   ANGLE FUNCTIONS
   ========================================================= */

function toRadians(value) {

    if (angleMode === "DEG") {

        return value * Math.PI / 180;

    }


    if (angleMode === "GRAD") {

        return value * Math.PI / 200;

    }


    return value;

}


function fromRadians(value) {

    if (angleMode === "DEG") {

        return value * 180 / Math.PI;

    }


    if (angleMode === "GRAD") {

        return value * 200 / Math.PI;

    }


    return value;

}


function angleSin(x) {

    return Math.sin(
        toRadians(x)
    );

}


function angleCos(x) {

    return Math.cos(
        toRadians(x)
    );

}


function angleTan(x) {

    return Math.tan(
        toRadians(x)
    );

}


function angleAsin(x) {

    return fromRadians(
        Math.asin(x)
    );

}


function angleAcos(x) {

    return fromRadians(
        Math.acos(x)
    );

}


function angleAtan(x) {

    return fromRadians(
        Math.atan(x)
    );

}


/* =========================================================
   SHIFT
   ========================================================= */

function toggleShift() {

    shiftMode =
        !shiftMode;


    if (shiftMode) {

        shiftIndicator.classList.add(
            "active"
        );

    } else {

        shiftIndicator.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   ALPHA
   ========================================================= */

function toggleAlpha() {

    alphaMode =
        !alphaMode;


    if (alphaMode) {

        alphaIndicator.classList.add(
            "active"
        );

    } else {

        alphaIndicator.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   INDICATORS
   ========================================================= */

function updateIndicators() {

    shiftIndicator.classList.toggle(
        "active",
        shiftMode
    );


    alphaIndicator.classList.toggle(
        "active",
        alphaMode
    );


    angleModeDisplay.textContent =
        angleMode;


    memoryIndicator.classList.toggle(
        "active",
        memory !== 0
    );

}


/* =========================================================
   ANGLE MODE
   ========================================================= */

function cycleAngleMode() {

    if (angleMode === "DEG") {

        angleMode = "RAD";

    }

    else if (angleMode === "RAD") {

        angleMode = "GRAD";

    }

    else {

        angleMode = "DEG";

    }


    localStorage.setItem(
        "mosayadCalcAngle",
        angleMode
    );


    updateIndicators();

}


/* =========================================================
   MEMORY
   ========================================================= */

function saveMemory() {

    localStorage.setItem(
        "mosayadCalcMemory",
        memory
    );

}


function getCurrentValue() {

    try {

        return evaluateExpression(
            expression || "0"
        );

    }

    catch {

        return lastResult || 0;

    }

}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(value) {

    if (
        !Number.isFinite(value)
    ) {

        return "Math ERROR";

    }


    if (
        Math.abs(value) < 1e-12
    ) {

        value = 0;

    }


    const absolute =
        Math.abs(value);


    if (
        absolute >= 1e10 ||
        (
            absolute > 0 &&
            absolute < 1e-9
        )
    ) {

        return value.toExponential(8);

    }


    return Number(
        value.toPrecision(12)
    ).toString();

}


/* =========================================================
   HISTORY
   ========================================================= */

function addHistory(
    calculation,
    result
) {

    history.unshift({

        expression:
            calculation,

        result:
            result,

        time:
            Date.now()

    });


    history =
        history.slice(
            0,
            50
        );


    localStorage.setItem(
        "mosayadCalculatorHistory",
        JSON.stringify(history)
    );


    renderHistory();

}


/* =========================================================
   RENDER HISTORY
   ========================================================= */

function renderHistory() {

    if (!historyList) {

        return;

    }


    if (!history.length) {

        historyList.innerHTML = `

            <p class="empty-history">
                No calculations yet.
            </p>

        `;

        return;

    }


    historyList.innerHTML =
        history
            .map(
                (item, index) => `

                <button
                    class="history-item"
                    data-history-index="${index}"
                    type="button"
                >

                    <span class="history-expression">
                        ${escapeHTML(
                            item.expression
                        )}
                    </span>

                    <span class="history-equals">
                        =
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatNumber(
                                item.result
                            )
                        )}
                    </strong>

                </button>

            `
            )
            .join("");


    historyList
        .querySelectorAll(
            ".history-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .historyIndex
                        );


                    const item =
                        history[index];


                    if (!item) {

                        return;

                    }


                    expression =
                        String(
                            item.result
                        );


                    resultDisplay.textContent =
                        formatNumber(
                            item.result
                        );


                    updateDisplay();

                    closeAllPanels();

                }
            );

        });

}


/* =========================================================
   CLEAR HISTORY
   ========================================================= */

const clearHistoryButton =
    document.getElementById(
        "clear-history"
    );


if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        () => {

            history = [];

            localStorage.removeItem(
                "mosayadCalculatorHistory"
            );

            renderHistory();

        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   REPLAY
   ========================================================= */

function moveCursorLike(direction) {

    /*
       The HTML calculator doesn't contain
       a real text cursor.

       We use replay buttons to move through
       history.
    */

    if (!history.length) {

        return;

    }


    if (direction < 0) {

        const item =
            history[0];

        expression =
            String(item.expression);

    } else {

        const item =
            history[0];

        expression =
            String(item.result);

    }


    updateDisplay();

}


/* =========================================================
   MODE MENU
   ========================================================= */

function toggleMenu() {

    modeMenu.classList.toggle(
        "hidden"
    );

}


function selectMode(mode) {

    currentMode = mode;


    modeMenu.classList.add(
        "hidden"
    );


    closeAllPanels();


    switch (mode) {

        case "calculate":

            break;


        case "complex":

            showTemporaryMessage(
                "Complex mode is coming soon."
            );

            break;


        case "equation":

            openPanel(
                equationPanel
            );

            break;


        case "table":

            openPanel(
                tablePanel
            );

            break;


        case "statistics":

            showTemporaryMessage(
                "Statistics mode is coming soon."
            );

            break;

    }

}


/* =========================================================
   OPEN PANEL
   ========================================================= */

function openPanel(panel) {

    closeAllPanels();

    panel.classList.remove(
        "hidden"
    );

    panel.scrollIntoView({

        behavior: "smooth",

        block: "nearest"

    });

}


/* =========================================================
   CLOSE PANELS
   ========================================================= */

function closeAllPanels() {

    [
        equationPanel,
        tablePanel,
        historyPanel
    ]
        .forEach(panel => {

            if (panel) {

                panel.classList.add(
                    "hidden"
                );

            }

        });

}


/* =========================================================
   SETUP
   ========================================================= */

function openSetup() {

    const current =
        angleMode;


    const selected =
        prompt(
            "Angle Mode:\n\n1 = DEG\n2 = RAD\n3 = GRAD\n\nCurrent: " +
            current
        );


    if (selected === null) {

        return;

    }


    if (selected === "1") {

        angleMode = "DEG";

    }

    else if (selected === "2") {

        angleMode = "RAD";

    }

    else if (selected === "3") {

        angleMode = "GRAD";

    }

    else {

        return;

    }


    localStorage.setItem(
        "mosayadCalcAngle",
        angleMode
    );


    updateIndicators();

}


/* =========================================================
   TEMP MESSAGE
   ========================================================= */

function showTemporaryMessage(
    message
) {

    resultDisplay.textContent =
        message;


    setTimeout(
        () => {

            resultDisplay.textContent =
                expression
                    ? formatDisplayExpression(
                        expression
                    )
                    : "0";

        },
        1800
    );

}


function formatDisplayExpression(
    value
) {

    return value
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−");

}


/* =========================================================
   EQUATION SOLVER
   ========================================================= */


function setupEquationInputs() {

    renderEquationInputs();

}


function renderEquationInputs() {

    if (!equationInputs) {

        return;

    }


    if (equationType === "linear") {

        equationInputs.innerHTML = `

            <div class="equation-row">

            <input
                id="linear-a"
                class="coefficient-input"
                type="number"
                step="any"
                placeholder="a"
            >

            <span>x +</span>

            <input
                id="linear-b"
                class="coefficient-input"
                type="number"
                step="any"
                placeholder="b"
            >

            <span>= 0</span>

            </div>

        `;

    }

    else {

        equationInputs.innerHTML = `

            <div class="equation-row quadratic-row">

                <input
                    id="quadratic-a"
                    class="coefficient-input"
                    type="number"
                    step="any"
                    placeholder="a"
                >

                <span>x² +</span>

                <input
                    id="quadratic-b"
                    class="coefficient-input"
                    type="number"
                    step="any"
                    placeholder="b"
                >

                <span>x +</span>

                <input
                    id="quadratic-c"
                    class="coefficient-input"
                    type="number"
                    step="any"
                    placeholder="c"
                >

                <span>= 0</span>

            </div>

        `;

    }

}


/* =========================================================
   EQUATION TYPE
   ========================================================= */

document
    .querySelectorAll(
        ".equation-type-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".equation-type-button"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                equationType =
                    button.dataset
                        .equationType;


                renderEquationInputs();

            }
        );

    });


/* =========================================================
   SOLVE EQUATION
   ========================================================= */

const solveEquationButton =
    document.getElementById(
        "solve-equation"
    );


if (solveEquationButton) {

    solveEquationButton.addEventListener(
        "click",
        solveEquation
    );

}


function solveEquation() {

    try {

        if (equationType === "linear") {

            solveLinear();

        } else {

            solveQuadratic();

        }

    }

    catch {

        equationResult.innerHTML = `
            <div class="error-result">
                Invalid equation.
            </div>
        `;

    }

}


/* =========================================================
   LINEAR
   ========================================================= */

function solveLinear() {

    const a =
        Number(
            document.getElementById(
                "linear-a"
            ).value
        );


    const b =
        Number(
            document.getElementById(
                "linear-b"
            ).value
        );


    if (a === 0) {

        if (b === 0) {

            equationResult.innerHTML = `
                <strong>
                    Infinite solutions
                </strong>
            `;

        } else {

            equationResult.innerHTML = `
                <strong>
                    No solution
                </strong>
            `;

        }

        return;

    }


    const x =
        -b / a;


    equationResult.innerHTML = `

        <div class="equation-answer">

            <span>
                x =
            </span>

            <strong>
                ${formatNumber(x)}
            </strong>

        </div>

        <small>
            ${a}x + ${b} = 0
        </small>

    `;

}


/* =========================================================
   QUADRATIC
   ========================================================= */

function solveQuadratic() {

    const a =
        Number(
            document.getElementById(
                "quadratic-a"
            ).value
        );


    const b =
        Number(
            document.getElementById(
                "quadratic-b"
            ).value
        );


    const c =
        Number(
            document.getElementById(
                "quadratic-c"
            ).value
        );


    if (a === 0) {

        if (b === 0) {

            equationResult.innerHTML = `
                No valid quadratic equation.
            `;

            return;

        }


        const x =
            -c / b;


        equationResult.innerHTML = `

            <div class="equation-answer">

                <span>
                    Linear solution:
                </span>

                <strong>
                    x = ${formatNumber(x)}
                </strong>

            </div>

        `;

        return;

    }


    const discriminant =
        b * b -
        4 * a * c;


    if (discriminant > 0) {

        const sqrtD =
            Math.sqrt(
                discriminant
            );


        const x1 =
            (-b + sqrtD) /
            (2 * a);


        const x2 =
            (-b - sqrtD) /
            (2 * a);


        equationResult.innerHTML = `

            <div class="equation-answer">

                <div>
                    x₁ =
                    <strong>
                        ${formatNumber(x1)}
                    </strong>
                </div>

                <div>
                    x₂ =
                    <strong>
                        ${formatNumber(x2)}
                    </strong>
                </div>

            </div>

        `;

    }

    else if (discriminant === 0) {

        const x =
            -b /
            (2 * a);


        equationResult.innerHTML = `

            <div class="equation-answer">

                <div>
                    One real solution:
                </div>

                <strong>
                    x = ${formatNumber(x)}
                </strong>

            </div>

        `;

    }

    else {

        const real =
            -b /
            (2 * a);


        const imaginary =
            Math.sqrt(
                -discriminant
            ) /
            Math.abs(2 * a);


        equationResult.innerHTML = `

            <div class="equation-answer">

                <div>
                    x₁ =
                    <strong>
                        ${formatNumber(real)}
                        +
                        ${formatNumber(imaginary)}i
                    </strong>
                </div>

                <div>
                    x₂ =
                    <strong>
                        ${formatNumber(real)}
                        −
                        ${formatNumber(imaginary)}i
                    </strong>
                </div>

            </div>

        `;

    }

}


/* =========================================================
   TABLE
   ========================================================= */

const generateTableButton =
    document.getElementById(
        "generate-table"
    );


if (generateTableButton) {

    generateTableButton.addEventListener(
        "click",
        generateTable
    );

}


function generateTable() {

    const functionInput =
        document.getElementById(
            "table-function"
        );


    const startInput =
        document.getElementById(
            "table-start"
        );


    const endInput =
        document.getElementById(
            "table-end"
        );


    const stepInput =
        document.getElementById(
            "table-step"
        );


    const fnText =
        functionInput.value.trim();


    const start =
        Number(
            startInput.value
        );


    const end =
        Number(
            endInput.value
        );


    const step =
        Number(
            stepInput.value
        );


    if (
        !fnText ||
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        !Number.isFinite(step) ||
        step === 0
    ) {

        tableResult.innerHTML = `
            <div class="error-result">
                Please enter valid table settings.
            </div>
        `;

        return;

    }


    if (step > 0 && start > end) {

        tableResult.innerHTML = `
            <div class="error-result">
                Start must be smaller than End.
            </div>
        `;

        return;

    }


    if (step < 0 && start < end) {

        tableResult.innerHTML = `
            <div class="error-result">
                Start must be greater than End.
            </div>
        `;

        return;

    }


    const rows = [];

    let count = 0;

    const maxRows = 500;


    for (
        let x = start;

        (
            step > 0
                ? x <= end + 1e-12
                : x >= end - 1e-12
        ) &&
        count < maxRows;

        x += step
    ) {

        try {

            const y =
                evaluateTableFunction(
                    fnText,
                    x
                );


            rows.push({

                x,

                y

            });

        }

        catch {

            rows.push({

                x,

                y: "ERROR"

            });

        }


        count++;

    }


    renderTable(
        rows,
        fnText
    );

}


/* =========================================================
   TABLE EVALUATOR
   ========================================================= */

function evaluateTableFunction(
    functionText,
    x
) {

    let expr =
        functionText
            .replaceAll(
                "×",
                "*"
            )
            .replaceAll(
                "÷",
                "/"
            )
            .replaceAll(
                "π",
                "PI"
            );


    /*
       x is replaced with a safe
       numeric value.
    */

    expr =
        expr.replace(
            /\bx\b/gi,
            `(${x})`
        );


    return evaluateExpression(
        expr
    );

}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderTable(
    rows,
    functionText
) {

    if (!rows.length) {

        tableResult.innerHTML = `
            <div class="error-result">
                No table rows.
            </div>
        `;

        return;

    }


    let html = `

        <div class="table-title">

            <span>
                f(x) =
                ${escapeHTML(functionText)}
            </span>

        </div>

        <div class="scientific-table-wrapper">

            <table class="scientific-table">

                <thead>

                    <tr>

                        <th>
                            x
                        </th>

                        <th>
                            f(x)
                        </th>

                    </tr>

                </thead>

                <tbody>

    `;


    rows.forEach(row => {

        html += `

            <tr>

                <td>
                    ${escapeHTML(
                        formatNumber(row.x)
                    )}
                </td>

                <td>
                    ${
                        typeof row.y === "number"
                            ? escapeHTML(
                                formatNumber(
                                    row.y
                                )
                            )
                            : "ERROR"
                    }
                </td>

            </tr>

        `;

    });


    html += `

                </tbody>

            </table>

        </div>

    `;


    tableResult.innerHTML =
        html;

}


/* =========================================================
   THEME
   ========================================================= */

function applySavedTheme() {

    const theme =
        localStorage.getItem(
            "mosayadCalculatorTheme"
        );


    if (theme === "light") {

        document.body.classList.add(
            "light"
        );

        themeButton.textContent =
            "☀️";

    } else {

        document.body.classList.remove(
            "light"
        );

        themeButton.textContent =
            "🌙";

    }

}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light"
            );


            const light =
                document.body.classList.contains(
                    "light"
                );


            localStorage.setItem(
                "mosayadCalculatorTheme",
                light
                    ? "light"
                    : "dark"
            );


            themeButton.textContent =
                light
                    ? "☀️"
                    : "🌙";

        }
    );

}


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
           Don't interfere with inputs.
        */

        if (
            event.target.tagName ===
                "INPUT" ||
            event.target.tagName ===
                "TEXTAREA"
        ) {

            return;

        }


        const key =
            event.key;


        /* Numbers */

        if (
            /^[0-9]$/.test(key)
        ) {

            appendExpression(key);

            return;

        }


        /* Decimal */

        if (key === ".") {

            appendExpression(".");

            return;

        }


        /* Operators */

        if (
            key === "+" ||
            key === "-" ||
            key === "*" ||
            key === "/"
        ) {

            appendExpression(key);

            return;

        }


        /* Parentheses */

        if (key === "(") {

            appendExpression("(");

            return;

        }


        if (key === ")") {

            appendExpression(")");

            return;

        }


        /* Enter */

        if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculate();

            return;

        }


        /* Backspace */

        if (
            key === "Backspace"
        ) {

            event.preventDefault();

            expression =
                expression.slice(
                    0,
                    -1
                );

            updateDisplay();

            return;

        }


        /* Escape */

        if (
            key === "Escape"
        ) {

            expression = "";

            resultDisplay.textContent =
                "0";

            updateDisplay();

        }

    }
);


/* =========================================================
   AUTO CLOSE MENU WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            modeMenu &&
            !modeMenu.contains(
                event.target
            ) &&
            !event.target.closest(
                '[data-action="mode"]'
            )
        ) {

            modeMenu.classList.add(
                "hidden"
            );

        }

    }
);


/* =========================================================
   PREVENT DOUBLE TAP ZOOM ON BUTTONS
   ========================================================= */

document
    .querySelectorAll("button")
    .forEach(button => {

        button.addEventListener(
            "dblclick",
            event => {

                event.preventDefault();

            }
        );

    });


/* =========================================================
   INITIAL DISPLAY
   ========================================================= */

updateDisplay();

updateIndicators();

renderHistory();