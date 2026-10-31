// Estado da Aplicação
let users = [];
let currentUser = null;
let currentQuizCategory = null;
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let currentQuizScore = 0;

// Elementos DOM
const screenAuth = document.getElementById('screenAuth');
const screenCategory = document.getElementById('screenCategory');
const screenQuiz = document.getElementById('screenQuiz');
const screenResult = document.getElementById('screenResult');

const userInfoHeader = document.getElementById('userInfoHeader');
const userNameDisplay = document.getElementById('userNameDisplay');
const userScoreDisplay = document.getElementById('userScoreDisplay');
const btnLogoutHeader = document.getElementById('btnLogoutHeader');

const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const rankingTableBody = document.getElementById('rankingTableBody');
const categoryGrid = document.getElementById('categoryGrid');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
  setupEventListeners();
  renderRanking();
});

function loadUsers() {
  const stored = localStorage.getItem('cinemafa_users_db');
  if (stored) {
    users = JSON.parse(stored);
  } else {
    users = [...INITIAL_USERS];
    saveUsers();
  }
}

function saveUsers() {
  localStorage.setItem('cinemafa_users_db', JSON.stringify(users));
}

function setupEventListeners() {
  // Troca de Abas Login/Cadastro
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // Form Submits
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);

  // Logout
  btnLogoutHeader.addEventListener('click', handleLogout);
  document.getElementById('btnLogoutResult').addEventListener('click', handleLogout);

  // Botão Escolher Outro Quiz
  document.getElementById('btnChooseAnotherQuiz').addEventListener('click', () => {
    showScreen(screenCategory);
    renderCategories();
  });
}

function handleLogin(e) {
  e.preventDefault();
  const name = document.getElementById('loginName').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();

  const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());

  if (!user) {
    alert('Usuário não encontrado. Verifique o nome digitado ou faça o cadastro.');
    return;
  }

  // Verifica senha se existir no cadastro
  if (user.password && user.password !== pass) {
    alert('Senha incorreta!');
    return;
  }

  loginUser(user);
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value.trim();

  if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
    alert('Este nome já está cadastrado!');
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: pass,
    score: 0,
    completedQuizzes: []
  };

  users.push(newUser);
  saveUsers();
  alert('Cadastro realizado com sucesso!');
  loginUser(newUser);
}

function loginUser(user) {
  currentUser = user;
  if (!currentUser.completedQuizzes) currentUser.completedQuizzes = [];
  
  userNameDisplay.textContent = currentUser.name;
  userScoreDisplay.textContent = `${currentUser.score} pts`;
  userInfoHeader.style.display = 'flex';

  document.getElementById('loginName').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('regName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';

  renderCategories();
  showScreen(screenCategory);
}

function handleLogout() {
  currentUser = null;
  userInfoHeader.style.display = 'none';
  renderRanking();
  showScreen(screenAuth);
}

function renderRanking() {
  // Ordena por pontuação
  const sorted = [...users].sort((a, b) => b.score - a.score);
  const top5 = sorted.slice(0, 5);

  rankingTableBody.innerHTML = '';

  top5.forEach((user, index) => {
    const tr = document.createElement('tr');
    let medal = `${index + 1}º`;
    if (index === 0) medal = '🥇 1º';
    if (index === 1) medal = '🥈 2º';
    if (index === 2) medal = '🥉 3º';

    tr.innerHTML = `
      <td><strong>${medal}</strong></td>
      <td>${escapeHtml(user.name)}</td>
      <td style="text-align: right; font-weight: 700; color: var(--secondary);">${user.score} pts</td>
    `;
    rankingTableBody.appendChild(tr);
  });
}

function renderCategories() {
  categoryGrid.innerHTML = '';

  Object.keys(QUIZ_DATABASE).forEach(catKey => {
    const isCompleted = currentUser.completedQuizzes.includes(catKey);
    const card = document.createElement('div');
    card.className = `quiz-card ${isCompleted ? 'completed' : ''}`;

    card.innerHTML = `
      <div>
        <div class="quiz-title">${CATEGORY_NAMES[catKey]}</div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          ${isCompleted ? '✅ Quiz já respondido!' : '10 perguntas sorteadas'}
        </p>
      </div>
      <button class="btn ${isCompleted ? 'btn-outline' : 'btn-primary'}" ${isCompleted ? 'disabled' : ''}>
        ${isCompleted ? 'Concluído' : 'Iniciar Quiz'}
      </button>
    `;

    if (!isCompleted) {
      card.querySelector('button').addEventListener('click', () => startQuiz(catKey));
    }

    categoryGrid.appendChild(card);
  });
}

function startQuiz(categoryKey) {
  currentQuizCategory = categoryKey;
  const allQuestions = QUIZ_DATABASE[categoryKey];

  // Seleciona 10 perguntas aleatórias de 30
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  currentQuizQuestions = shuffled.slice(0, 10);

  currentQuestionIndex = 0;
  currentQuizScore = 0;

  document.getElementById('quizCategoryTitle').textContent = CATEGORY_NAMES[categoryKey];
  showScreen(screenQuiz);
  renderQuestion();
}

function renderQuestion() {
  const qData = currentQuizQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / 10) * 100;

  document.getElementById('quizProgressText').textContent = `Pergunta ${currentQuestionIndex + 1} de 10`;
  document.getElementById('progressBarFill').style.width = `${progressPercent}%`;

  document.getElementById('questionText').textContent = qData.q;
  
  const optionsList = document.getElementById('optionsList');
  optionsList.innerHTML = '';

  const feedbackBox = document.getElementById('feedbackBox');
  feedbackBox.className = 'feedback-box hidden';

  qData.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = optText;
    btn.addEventListener('click', () => handleOptionSelect(idx));
    optionsList.appendChild(btn);
  });
}

function handleOptionSelect(selectedIndex) {
  const qData = currentQuizQuestions[currentQuestionIndex];
  const buttons = document.querySelectorAll('#optionsList .option-btn');
  const feedbackBox = document.getElementById('feedbackBox');

  // Desabilita botões
  buttons.forEach(btn => btn.disabled = true);

  if (selectedIndex === qData.answer) {
    currentQuizScore++;
    buttons[selectedIndex].classList.add('correct');
    feedbackBox.textContent = '✨ Resposta Correta!';
    feedbackBox.className = 'feedback-box correct';
  } else {
    buttons[selectedIndex].classList.add('wrong');
    buttons[qData.answer].classList.add('correct');
    feedbackBox.textContent = `❌ Incorreto! A resposta certa era: "${qData.options[qData.answer]}"`;
    feedbackBox.className = 'feedback-box wrong';
  }

  // Avança automaticamente após 1.5s
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < 10) {
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 1500);
}

function finishQuiz() {
  // Atualiza pontuação do usuário e registra o quiz como concluído
  currentUser.score += currentQuizScore;
  currentUser.completedQuizzes.push(currentQuizCategory);

  // Atualiza banco no localStorage
  const uIndex = users.findIndex(u => u.id === currentUser.id);
  if (uIndex !== -1) {
    users[uIndex] = currentUser;
    saveUsers();
  }

  userScoreDisplay.textContent = `${currentUser.score} pts`;

  // Preenche tela de resultado
  document.getElementById('resultCategoryName').textContent = CATEGORY_NAMES[currentQuizCategory];
  document.getElementById('resultScore').textContent = `${currentQuizScore} / 10`;

  let msg = "Excelente! Você é um verdadeiro fã!";
  if (currentQuizScore < 5) msg = "Bom intento! Que tal rever esta obra e tentar outros quizzes?";
  else if (currentQuizScore < 8) msg = "Muito bom! Você conhece bastante sobre este tema!";

  document.getElementById('resultMessage').textContent = msg;

  showScreen(screenResult);
}

function showScreen(screen) {
  [screenAuth, screenCategory, screenQuiz, screenResult].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}