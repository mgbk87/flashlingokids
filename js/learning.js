// Learning Mode: picture flips in -> word fades in at 1s (together with the
// start of dictation) -> the word is read once slowly, then once at normal
// pace -> Sound button repeats that same slow+normal sequence any time ->
// Next unlocks once the full dictation has played through. After the last
// card, a completion popup offers Repeat or Close.

const WORD_REVEAL_MS = 1000;

const LearningMode = {
  cards: [],
  index: 0,
  category: null,
  timers: [],
  playToken: 0,

  start(category) {
    this.category = category;
    this.cards = [...category.cards].sort(() => Math.random() - 0.5);
    this.index = 0;
    this.bindOnce();
    App.showScreen('screen-learning');
    this.showCard();
  },

  bindOnce() {
    if (this._bound) return;
    this._bound = true;
    document.getElementById('btn-sound').addEventListener('click', () => {
      App.speakWord(this.cards[this.index].word);
    });
    document.getElementById('btn-next-card').addEventListener('click', () => {
      if (this.index >= this.cards.length - 1) {
        this.showCompletion();
      } else {
        this.index += 1;
        this.showCard();
      }
    });
    document.getElementById('btn-learning-repeat').addEventListener('click', () => {
      document.getElementById('learning-complete-overlay').hidden = true;
      this.cards = [...this.category.cards].sort(() => Math.random() - 0.5);
      this.index = 0;
      this.showCard();
    });
    document.getElementById('btn-learning-close').addEventListener('click', () => {
      document.getElementById('learning-complete-overlay').hidden = true;
      window.speechSynthesis.cancel();
      App.showScreen('screen-categories');
    });
  },

  clearTimers() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  },

  showCompletion() {
    this.clearTimers();
    window.speechSynthesis.cancel();
    document.getElementById('learning-complete-message').textContent =
      `You've seen every card in ${this.category.name}! Want to go again?`;
    document.getElementById('learning-complete-overlay').hidden = false;
  },

  showCard() {
    this.clearTimers();
    window.speechSynthesis.cancel();
    const myToken = ++this.playToken;

    const card = this.cards[this.index];
    const img = document.getElementById('learning-image');
    const wordEl = document.getElementById('learning-word');
    const nextBtn = document.getElementById('btn-next-card');
    const pill = document.getElementById('learning-progress-pill');

    pill.textContent = `${this.index + 1} / ${this.cards.length}`;

    // Hide the word instantly (no fade) before swapping its text, otherwise
    // the CSS transition animates the *new* word from visible -> hidden for
    // a moment (since it was still carrying the previous card's opacity: 1)
    // before it properly fades in at the 1s mark.
    wordEl.classList.remove('visible');
    wordEl.style.transition = 'none';
    wordEl.textContent = card.word;
    // eslint-disable-next-line no-unused-expressions
    wordEl.offsetHeight; // force reflow so the instant hide commits
    wordEl.style.transition = '';

    nextBtn.disabled = true;

    // Restart the pop-in animation once the new image has actually loaded,
    // so the reveal plays against the new picture instead of the old one
    // (or a not-yet-decoded blank frame).
    img.onload = () => {
      img.style.animation = 'none';
      // eslint-disable-next-line no-unused-expressions
      img.offsetHeight;
      img.style.animation = '';
    };
    img.src = card.image;
    img.alt = card.word;

    App.markSeen(this.category.id, card.id);

    this.timers.push(setTimeout(() => {
      wordEl.classList.add('visible');
      App.speakWord(card.word, () => {
        if (myToken === this.playToken) nextBtn.disabled = false;
      });
    }, WORD_REVEAL_MS));
  },
};
