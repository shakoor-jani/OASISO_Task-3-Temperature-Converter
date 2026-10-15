// ============================================================
// Temperature Converter - script.js
// Strategy: convert input -> Kelvin -> Celsius / Fahrenheit / Kelvin
// ============================================================

// ===== Constants =====
const KELVIN_OFFSET = 273.15;          // 0 °C = 273.15 K
const ABSOLUTE_ZERO_KELVIN = 0;        // lowest possible temperature
const TOLERANCE = 1e-9;                // small allowance for floating-point errors

const UNITS = {
  C: { name: "Celsius",    symbol: "°C", absoluteZero: -273.15 },
  F: { name: "Fahrenheit", symbol: "°F", absoluteZero: -459.67 },
  K: { name: "Kelvin",     symbol: "K",  absoluteZero: 0 }
};

// ===== Select HTML elements (IDs must match index.html) =====
const form = document.getElementById("converter-form");
const temperatureInput = document.getElementById("temperature-input");
const unitSelect = document.getElementById("unit-select");
const resetButton = document.getElementById("reset-btn");
const messageBox = document.getElementById("message-box");
const resultCelsius = document.getElementById("result-celsius");
const resultFahrenheit = document.getElementById("result-fahrenheit");
const resultKelvin = document.getElementById("result-kelvin");

// ===== Conversion functions =====

// Step 1: any unit -> Kelvin
function toKelvin(value, unit) {
  if (unit === "C") {
    return value + KELVIN_OFFSET;
  }
  if (unit === "F") {
    return ((value - 32) * 5) / 9 + KELVIN_OFFSET;
  }
  return value; // already Kelvin
}

// Step 2: Kelvin -> Celsius
function kelvinToCelsius(kelvin) {
  return kelvin - KELVIN_OFFSET;
}

// Step 3: Kelvin -> Fahrenheit
function kelvinToFahrenheit(kelvin) {
  return ((kelvin - KELVIN_OFFSET) * 9) / 5 + 32;
}

// ===== Formatting =====

// Show 2 decimals and avoid "-0.00"
function formatTemperature(value) {
  const rounded = Number(value.toFixed(2));
  const safeValue = rounded === 0 ? 0 : rounded; // -0 === 0 is true, so -0 becomes 0
  return safeValue.toFixed(2);
}

// ===== Message helpers =====

function showMessage(text, type) {
  messageBox.textContent = text; // textContent = safe (no HTML injection)
  messageBox.className = "message message--" + type;
  if (type === "error") {
    temperatureInput.setAttribute("aria-invalid", "true");
  }
}

function clearMessage() {
  messageBox.textContent = "";
  messageBox.className = "message";
  temperatureInput.removeAttribute("aria-invalid");
}

// ===== Results helpers =====

function clearResults() {
  resultCelsius.textContent = "--";
  resultFahrenheit.textContent = "--";
  resultKelvin.textContent = "--";
}

function showResults(celsius, fahrenheit, kelvin) {
  resultCelsius.textContent = formatTemperature(celsius) + " °C";
  resultFahrenheit.textContent = formatTemperature(fahrenheit) + " °F";
  resultKelvin.textContent = formatTemperature(kelvin) + " K";
}

// ===== Input reading & validation =====

// Returns { ok: true, value } or { ok: false, message }
function readTemperature() {
  const rawValue = temperatureInput.value.trim();

  if (rawValue === "") {
    // type="number" gives "" for both empty AND invalid text, so check badInput
    if (temperatureInput.validity.badInput) {
      return {
        ok: false,
        message: "Invalid input. Please enter a number such as 25 or -10.5."
      };
    }
    return { ok: false, message: "Please enter a temperature value." };
  }

  const value = Number(rawValue);

  // Rejects NaN, Infinity and -Infinity
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      message: "Invalid input. Please enter a valid finite number."
    };
  }

  return { ok: true, value: value };
}

// ===== Main conversion handler =====

function handleConvert(event) {
  event.preventDefault(); // stop page reload on form submit

  clearMessage();

  const reading = readTemperature();
  if (!reading.ok) {
    clearResults();
    showMessage(reading.message, "error");
    return;
  }

  const unit = unitSelect.value;
  const unitInfo = UNITS[unit];
  let kelvin = toKelvin(reading.value, unit);

  // Absolute zero check (tolerance protects boundary values)
  if (kelvin < ABSOLUTE_ZERO_KELVIN - TOLERANCE) {
    clearResults();
    showMessage(
      "That temperature is below absolute zero. The minimum for " +
        unitInfo.name + " is " + unitInfo.absoluteZero + " " + unitInfo.symbol + ".",
      "error"
    );
    return;
  }

  // Valid boundary value with tiny float error (e.g. -1e-14) -> exactly 0
  if (kelvin < ABSOLUTE_ZERO_KELVIN) {
    kelvin = ABSOLUTE_ZERO_KELVIN;
  }

  const celsius = kelvinToCelsius(kelvin);
  const fahrenheit = kelvinToFahrenheit(kelvin);

  // Very large numbers can overflow to Infinity
  if (!Number.isFinite(celsius) || !Number.isFinite(fahrenheit) || !Number.isFinite(kelvin)) {
    clearResults();
    showMessage("That number is too large to convert.", "error");
    return;
  }

  showResults(celsius, fahrenheit, kelvin);
  showMessage(
    "Converted " + reading.value + " " + unitInfo.symbol + " successfully.",
    "success"
  );
}

// ===== Reset handler =====

function handleReset() {
  form.reset();          // clears input, dropdown goes back to Celsius
  clearMessage();
  clearResults();
  temperatureInput.focus();
}

// ===== Event listeners =====
// "submit" runs on Convert button click AND when Enter is pressed in the input
form.addEventListener("submit", handleConvert);
resetButton.addEventListener("click", handleReset);

// Remove the old error as soon as the user starts typing again
temperatureInput.addEventListener("input", function () {
  if (messageBox.classList.contains("message--error")) {
    clearMessage();
  }
});