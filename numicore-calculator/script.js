// Global variables
let input = "";
let mode = "basic";
const display = document.getElementById("display");
const keypad = document.getElementById("keypad");
const graphCanvas = document.getElementById("graphCanvas");
let chart = null;

// Keypads for each mode
const keypads = {
  basic: ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'],
  algebra: ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'x', '+', 'C'],
  equation: ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C', 'Solve'],
  calculus: ['diff(', 'integrate(', ')', '/', 'x', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', 'C'],
  trig: ['sin(', 'cos(', 'tan(', ')', 'pi', 'e', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', 'C'],
  graph: ['x', '^', '+', '-', '(', ')', 'sin(', 'cos(', 'tan(', 'pi', 'e', 'C', 'Plot']
};

// Initialize keypad buttons for current mode
function loadKeypad() {
  keypad.innerHTML = '';
  graphCanvas.style.display = 'none';

  let keys = keypads[mode];
  keys.forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = key;
    btn.onclick = () => handleKey(key);
    keypad.appendChild(btn);
  });

  clearDisplay();
}

// Handle button presses
function handleKey(key) {
  if (key === 'C') {
    clearDisplay();
    return;
  }

  if (key === '=') {
    solve();
    return;
  }

  if (key === 'Solve') {
    solveEquation();
    return;
  }

  if (key === 'Plot') {
    plotGraph();
    return;
  }

  input += key;
  updateDisplay(input);
}

function updateDisplay(text) {
  display.textContent = text || '0';
}

function clearDisplay() {
  input = '';
  updateDisplay('0');
  if(chart) {
    chart.destroy();
    chart = null;
  }
  graphCanvas.style.display = 'none';
}

// Evaluate expressions, differentiation, integration
function solve() {
  try {
    let result;

    if (mode === 'calculus') {
      if (input.startsWith('diff(') && input.endsWith(')')) {
        const expr = input.slice(5, -1);
        result = math.derivative(expr, 'x').toString();
      } else if (input.startsWith('integrate(') && input.endsWith(')')) {
        const expr = input.slice(9, -1);
        result = math.integrate(expr, 'x').toString();
      } else {
        result = math.evaluate(input);
      }
    } else if (mode === 'trig') {
      // Replace pi and e for mathjs compatibility
      const expr = input.replace(/pi/g, 'pi').replace(/e/g, 'e');
      result = math.evaluate(expr);
    } else {
      result = math.evaluate(input);
    }

    input = result.toString();
    updateDisplay(input);
  } catch {
    updateDisplay('Error');
    input = '';
  }
}

// Solve linear and quadratic equations for x
function solveEquation() {
  try {
    if (!input.includes('=')) {
      updateDisplay("Use '=' in equation");
      return;
    }
    const sides = input.split('=');
    if (sides.length !== 2) {
      updateDisplay("Invalid equation");
      return;
    }

    // equation as left - right = 0
    const equation = math.parse(`(${sides[0]}) - (${sides[1]})`);

    // math.js solve only for polynomials up to degree 2, so try numeric approx for complex otherwise
    const solutions = math.solve(equation, 'x');

    if (solutions.length === 0) {
      updateDisplay('No solution');
      return;
    }
    input = solutions.map(sol => `x=${sol.toString()}`).join(', ');
    updateDisplay(input);
  } catch {
    updateDisplay('Invalid Eqn');
    input = '';
  }
}

// Plot function for 'graph' mode
function plotGraph() {
  try {
    graphCanvas.style.display = 'block';

    const expr = input;
    const exprCompiled = math.compile(expr);

    const xValues = [];
    const yValues = [];
    const step = 0.1;

    for(let x = -10; x <= 10; x += step) {
      xValues.push(x.toFixed(2));
      // Evaluate y = f(x)
      let scope = {x: x};
      let y = exprCompiled.evaluate(scope);

      // Handle complex results by showing NaN
      if (typeof y === 'object' && y.im !== 0) y = NaN;
      yValues.push(y);
    }

    if(chart) chart.destroy();

    chart = new Chart(graphCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: xValues,
        datasets: [{
          label: `y = ${expr}`,
          data: yValues,
          borderColor: 'cyan',
          backgroundColor: 'transparent',
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.25
        }]
      },
      options: {
        animation: false,
        scales: {
          x: {
            title: { display: true, text: 'x' }
          },
          y: {
            title: { display: true, text: 'y' }
          }
        }
      }
    });

  } catch {
    updateDisplay('Invalid expression for plot');
  }
}

// Handle mode change
function changeMode() {
  mode = document.getElementById('mode').value;
  clearDisplay();
  updateDisplay(`Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);

  if (mode === 'graph') {
    graphCanvas.style.display = 'block';
  } else {
    graphCanvas.style.display = 'none';
  }

  loadKeypad();
}

// Keyboard input support
document.addEventListener('keydown', e => {
  // Allow digits, operators, parentheses, letters, and Enter/Ctrl+Z for undo not implemented here
  if (/[\d+\-*/().=x^]/i.test(e.key)) {
    e.preventDefault();
    input += e.key;
    updateDisplay(input);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    solve();
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    input = input.slice(0, -1);
    updateDisplay(input);
  } else if (e.key.toLowerCase() === 'c') {
    e.preventDefault();
    clearDisplay();
  }
});

// Initialize keypad on load
window.onload = () => {
  changeMode();
};
