// Test Mode: picture + 4 multiple-choice answers, scored quiz with a
// results screen at the end. Distractors are pulled from the same category.

const TestMode = {
  category: null,
  cards: [],
  index: 0,
  score: 0,
  locked: false,

  start(category) {
    this.category = category;
    this.cards = [...category.cards].sort(() => Math.random() - 0.5);
    this.index = 0;
    this.score = 0;
    this.bindOnce();
    App.showScreen('screen-test');
    this.showQuestion();
  },

  bindOnce() {
    if (this._bound) return;
    this._bound = true;
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.start(this.category);
    });
  },

  pickDistractors(correctCard) {
    const pool = this.category.cards.filter((c) => c.id !== correctCard.id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  },

  showQuestion() {
    this.locked = false;
    const card = this.cards[this.index];
    const img = document.getElementById('test-image');
    const answersEl = document.getElementById('quiz-answers');
    const feedbackEl = document.getElementById('quiz-feedback');
    const progressPill = document.getElementById('test-progress-pill');
    const scorePill = document.getElementById('test-score-pill');

    img.src = card.image;
    img.alt = 'What animal is this?';
    feedbackEl.textContent = '';
    feedbackEl.className = 'quiz-feedback';
    progressPill.textContent = `Question ${this.index + 1} / ${this.cards.length}`;
    scorePill.textContent = `⭐ ${this.score}`;

    const options = [card, ...this.pickDistractors(card)].sort(() => Math.random() - 0.5);
    answersEl.innerHTML = '';
    options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.setAttribute('role', 'listitem');
      btn.textContent = option.word;
      btn.addEventListener('click', () => this.handleAnswer(btn, option, card));
      answersEl.appendChild(btn);
    });
  },

  handleAnswer(btn, chosen, correctCard) {
    if (this.locked) return;
    this.locked = true;

    const feedbackEl = document.getElementById('quiz-feedback');
    const scorePill = document.getElementById('test-score-pill');
    const allButtons = document.querySelectorAll('#quiz-answers .answer-btn');
    allButtons.forEach((b) => (b.disabled = true));

    const isCorrect = chosen.id === correctCard.id;
    if (isCorrect) {
      this.score += 1;
      btn.classList.add('correct');
      feedbackEl.textContent = '🎉 Great job!';
      feedbackEl.classList.add('correct');
      App.playTone('correct');
      App.confettiBurst();
    } else {
      btn.classList.add('wrong');
      feedbackEl.textContent = `Good try! It's "${correctCard.word}".`;
      feedbackEl.classList.add('wrong');
      App.playTone('wrong');
      allButtons.forEach((b) => {
        if (b.textContent === correctCard.word) b.classList.add('correct');
      });
    }
    scorePill.textContent = `⭐ ${this.score}`;
    App.speakOnce(correctCard.word);

    setTimeout(() => {
      this.index += 1;
      if (this.index >= this.cards.length) {
        this.showResults();
      } else {
        this.showQuestion();
      }
    }, 1500);
  },

  showResults() {
    const total = this.cards.length;
    const accuracy = Math.round((this.score / total) * 100);
    document.getElementById('results-score').textContent = `You scored ${this.score} / ${total}`;
    document.getElementById('results-accuracy').textContent = `${accuracy}% correct`;
    App.showScreen('screen-results');
    if (accuracy >= 70) App.confettiBurst();
  },
};
