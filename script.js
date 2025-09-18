// ===================== DOM Elements =====================
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expensesEl = document.getElementById('expenses');
const form = document.getElementById('transaction-form');
const descInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const typeInput = document.getElementById('type');
const transactionsList = document.getElementById('transactions');
const topCategoryEl = document.getElementById('top-category');
const progressBar = document.getElementById('spendingProgress');
const progressLabel = document.getElementById('progressLabel');
const budgetInput = document.getElementById('monthlyBudget');
const budgetWarning = document.getElementById('budgetWarning');
const filterCategory = document.getElementById('filterCategory');
const filterType = document.getElementById('filterType');
const ctx = document.getElementById('spendingChart').getContext('2d');

// ===================== Data =====================
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;

// ===================== Save Functions =====================
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function saveBudget() {
  localStorage.setItem('monthlyBudget', monthlyBudget);
}

// ===================== Add Transaction =====================
form.addEventListener('submit', e => {
  e.preventDefault();
  const description = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const type = typeInput.value;

  if (!description || isNaN(amount) || !category || !type) {
    alert("Please fill in all fields correctly.");
    return;
  }

  transactions.push({ id: Date.now(), description, amount, category, type });
  saveTransactions();
  renderTransactions();
  form.reset();
});

// ===================== Delete Transaction =====================
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactions();
}

// ===================== Render Transactions =====================
function renderTransactions() {
  transactionsList.innerHTML = '';
  let filtered = transactions;

  // Apply filters
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory.value);
  }
  if (filterType.value !== 'all') {
    filtered = filtered.filter(t => t.type === filterType.value);
  }

  filtered.forEach(t => {
    const li = document.createElement('li');
    li.classList.add(t.type);
    li.innerHTML = `${t.description} (${t.category}) - ₦${t.amount.toFixed(2)} <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>`;
    transactionsList.appendChild(li);
  });

  updateSummary();
  updateTopSpending();
  updateChartAndProgress();
}

// ===================== Update Summary =====================
function updateSummary() {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  balanceEl.textContent = `₦${(income - expenses).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  incomeEl.textContent = `₦${income.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  expensesEl.textContent = `₦${expenses.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

// ===================== Top Spending =====================
function updateTopSpending() {
  const expenses = transactions.filter(t => t.type === 'expense');
  if (!expenses.length) { 
    topCategoryEl.textContent = 'None yet'; 
    return; 
  }
  const categoryTotals = {};
  expenses.forEach(t => categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount);
  let maxCat = '', maxAmt = 0;
  for (const cat in categoryTotals) { 
    if (categoryTotals[cat] > maxAmt) { 
      maxCat = cat; 
      maxAmt = categoryTotals[cat]; 
    } 
  }
  topCategoryEl.textContent = `${maxCat} (₦${maxAmt.toFixed(2)})`;
}

// ===================== Chart.js =====================
let spendingChart = new Chart(ctx, {
  type: 'doughnut',
  data: { 
    labels: [], 
    datasets: [{ 
      label: 'Expenses', 
      data: [], 
      backgroundColor: ['#4f46e5', '#ec4899', '#22c55e', '#f59e0b', '#6366f1'] 
    }] 
  },
  options: { 
    responsive: true, 
    plugins: { legend: { position: 'bottom' } } 
  }
});

// ===================== Update Chart & Progress =====================
function updateChartAndProgress() {
  const categoryTotals = {};
  transactions.filter(t => t.type === 'expense')
    .forEach(t => categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount);

  spendingChart.data.labels = Object.keys(categoryTotals);
  spendingChart.data.datasets[0].data = Object.values(categoryTotals);
  spendingChart.update();

  const income = transactions.filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const percent = income ? Math.min((expenses / income) * 100, 100) : 0;

  progressBar.style.width = `${percent}%`;
  progressLabel.textContent = `${percent.toFixed(1)}%`;

  // Budget check
  if (monthlyBudget && expenses > monthlyBudget) {
    budgetWarning.style.display = 'block';
    // Trigger flash
    progressBar.classList.remove('flash');
    void progressBar.offsetWidth; // force reflow
    progressBar.classList.add('flash');
  } else {
    budgetWarning.style.display = 'none';
    progressBar.classList.remove('flash');
  }
}

// ===================== Monthly Budget =====================
budgetInput.value = monthlyBudget || '';
budgetInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    monthlyBudget = parseFloat(budgetInput.value) || 0;
    saveBudget();
    updateChartAndProgress();
  }
});

// ===================== Filters =====================
filterCategory.addEventListener('change', renderTransactions);
filterType.addEventListener('change', renderTransactions);

// ===================== Initialize =====================
document.addEventListener('DOMContentLoaded', () => {
  renderTransactions();
});
