// FlashLingoKids - core app state, navigation, settings, and shared helpers.
// Learning Mode and Test Mode logic live in js/learning.js and js/test.js;
// they read/write through the App namespace defined here.

const CATEGORY_ICONS = {
  'domestic-animals': '🐶',
  'farm-animals': '🐄',
  'forest-animals': '🦊',
  'arctic-animals': '🐧',
  'jungle-animals': '🦁',
  'sea-animals': '🐬',
  insects: '🐞',
  'wild-birds': '🦅',
  'farm-birds': '🐓',
  vegetables: '🥕',
  berries: '🍓',
  fruits: '🍎',
  aircraft: '✈️',
  'bicycle-transport': '🚲',
  'land-transport': '🚗',
  motorcycles: '🏍️',
  'rail-transport': '🚆',
  'water-transport': '⛵',
  colors: '🎨',
  rooms: '🚪',
  furniture: '🛋️',
  garden: '🌷',
  house: '🏠',
};

const GROUP_LABELS = {
  animals: 'Animals',
  produce: 'Fruits & Vegetables',
  transportation: 'Transportation',
  colors: 'Colors',
  home: 'Home',
};

const STORAGE_KEYS = {
  settings: 'flashlingokids_settings',
  progress: 'flashlingokids_progress',
};

// Common name patterns for female voices across Chrome/Edge/Safari/Firefox
// voice packs - the Web Speech API has no reliable gender field, so we match
// on name instead and fall back gracefully if nothing matches.
const FEMALE_VOICE_PATTERN = /female|zira|susan|samantha|victoria|karen|moira|tessa|fiona|serena|joanna|salli|kimberly|amy|emma|ava|allison|aria/i;

const App = {
  data: null, // parsed cards.json
  settings: { muted: false, rate: 1.0 },
  progress: {}, // { [categoryId]: [cardId, ...] }
  currentCategoryId: null,
  currentMode: null, // 'learning' | 'test'
  selectedVoice: null,

  async init() {
    this.loadSettings();
    this.loadProgress();
    this.data = await fetch('data/cards.json').then((r) => r.json());
    this.renderCategoryGrid();
    this.bindNav();
    this.bindSettings();
    this.initVoice();
  },

  // ---------- Voice selection ----------
  initVoice() {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const english = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
      const pool = english.length ? english : voices;
      this.selectedVoice =
        pool.find((v) => FEMALE_VOICE_PATTERN.test(v.name)) ||
        pool.find((v) => /google us english/i.test(v.name)) ||
        pool[0];
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  },

  // ---------- Persistence ----------
  loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.settings);
      if (raw) Object.assign(this.settings, JSON.parse(raw));
    } catch (e) { /* ignore corrupt storage */ }
  },
  saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.settings));
  },
  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.progress);
      if (raw) this.progress = JSON.parse(raw);
    } catch (e) { this.progress = {}; }
  },
  saveProgress() {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(this.progress));
  },
  markSeen(categoryId, cardId) {
    if (!this.progress[categoryId]) this.progress[categoryId] = [];
    if (!this.progress[categoryId].includes(cardId)) {
      this.progress[categoryId].push(cardId);
      this.saveProgress();
    }
  },
  getSeenCount(categoryId) {
    return (this.progress[categoryId] || []).length;
  },

  // ---------- Navigation ----------
  showScreen(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  getCategory(id) {
    return this.data.categories.find((c) => c.id === id);
  },

  bindNav() {
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentMode = btn.dataset.mode;
        document.getElementById('categories-title').textContent =
          this.currentMode === 'learning' ? 'Choose a Category to Learn' : 'Choose a Category for a Quiz';
        this.renderCategoryGrid();
        this.showScreen('screen-categories');
      });
    });

    document.getElementById('btn-back-to-home').addEventListener('click', () => {
      this.showScreen('screen-home');
    });

    document.getElementById('btn-learning-back').addEventListener('click', () => {
      window.speechSynthesis.cancel();
      this.showScreen('screen-categories');
    });

    document.getElementById('btn-test-back').addEventListener('click', () => {
      window.speechSynthesis.cancel();
      this.showScreen('screen-categories');
    });

    document.getElementById('btn-back-to-menu').addEventListener('click', () => {
      this.showScreen('screen-home');
    });
  },

  renderCategoryGrid() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    // Group categories by their `group` field (e.g. Animals, Fruits & Vegetables),
    // preserving each category's order within its group and the order groups
    // first appear in data/cards.json.
    const groups = new Map();
    this.data.categories.forEach((cat) => {
      const groupId = cat.group || 'other';
      if (!groups.has(groupId)) groups.set(groupId, []);
      groups.get(groupId).push(cat);
    });

    groups.forEach((cats, groupId) => {
      const section = document.createElement('section');
      section.className = 'category-section';
      const heading = document.createElement('h3');
      heading.className = 'category-section-title';
      heading.textContent = GROUP_LABELS[groupId] || groupId;
      section.appendChild(heading);

      const sectionGrid = document.createElement('div');
      sectionGrid.className = 'category-section-grid';
      sectionGrid.setAttribute('role', 'list');

      cats.forEach((cat) => {
        const total = cat.cards.length;
        const seen = Math.min(this.getSeenCount(cat.id), total);
        const completed = total > 0 && seen >= total;
        const card = document.createElement('button');
        card.className = 'category-card';
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
          ${completed ? '<span class="category-complete-badge" aria-label="Category completed" title="Completed">✓</span>' : ''}
          <span class="category-icon" aria-hidden="true">${CATEGORY_ICONS[cat.id] || '🐾'}</span>
          <span class="category-name">${cat.name}</span>
          ${this.currentMode === 'learning' ? `
            <span class="category-progress-track"><span class="category-progress-fill" style="width:${total ? (seen / total) * 100 : 0}%"></span></span>
            <span class="category-progress-label">${seen} / ${total} seen</span>
          ` : `<span class="category-progress-label">${total} cards</span>`}
        `;
        card.addEventListener('click', () => {
          this.currentCategoryId = cat.id;
          if (this.currentMode === 'learning') {
            LearningMode.start(cat);
          } else {
            TestMode.start(cat);
          }
        });
        sectionGrid.appendChild(card);
      });

      section.appendChild(sectionGrid);
      grid.appendChild(section);
    });
  },

  // ---------- Settings modal ----------
  bindSettings() {
    const overlay = document.getElementById('settings-overlay');
    const muted = document.getElementById('setting-muted');
    const rate = document.getElementById('setting-rate');

    muted.checked = this.settings.muted;
    rate.value = this.settings.rate;

    document.getElementById('btn-settings').addEventListener('click', () => {
      overlay.hidden = false;
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      overlay.hidden = true;
    });
    muted.addEventListener('change', () => {
      this.settings.muted = muted.checked;
      this.saveSettings();
      if (muted.checked) window.speechSynthesis.cancel();
    });
    rate.addEventListener('input', () => {
      this.settings.rate = parseFloat(rate.value);
      this.saveSettings();
    });
    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      if (confirm('Reset all learning progress? This cannot be undone.')) {
        this.progress = {};
        this.saveProgress();
        this.renderCategoryGrid();
      }
    });
  },

  // ---------- Shared audio helpers ----------
  // Same voice/pitch for every utterance in the app: a friendlier, slightly
  // higher-pitched female voice when one is available.
  _makeUtterance(word, rate) {
    const u = new SpeechSynthesisUtterance(word);
    u.rate = rate;
    u.pitch = 1.15;
    if (this.selectedVoice) u.voice = this.selectedVoice;
    return u;
  },

  // Reads the word aloud twice: first slowly (syllable-by-syllable feel) so
  // kids can hear each sound clearly, then again at normal conversational
  // pace. onAllDone fires once both passes finish (used to gate the Next
  // button so kids get a full listen before moving on). Used by Learning Mode.
  speakWord(word, onAllDone) {
    if (this.settings.muted || !('speechSynthesis' in window)) {
      if (onAllDone) onAllDone();
      return;
    }
    window.speechSynthesis.cancel();

    const normalRate = this.settings.rate;
    const slowRate = Math.max(0.45, normalRate * 0.55);
    const slowUtterance = this._makeUtterance(word, slowRate);
    const normalUtterance = this._makeUtterance(word, normalRate);
    slowUtterance.onend = () => window.speechSynthesis.speak(normalUtterance);
    if (onAllDone) normalUtterance.onend = onAllDone;
    window.speechSynthesis.speak(slowUtterance);
  },

  // Reads the word aloud once at normal pace - used by Test Mode to announce
  // the correct answer after a guess, without the slow first pass.
  speakOnce(word, onEnd) {
    if (this.settings.muted || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = this._makeUtterance(word, this.settings.rate);
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  },

  playTone(kind) {
    if (this.settings.muted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = kind === 'correct' ? [523.25, 659.25, 783.99] : [392, 329.6];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        osc.connect(gain).connect(ctx.destination);
        const start = ctx.currentTime + i * 0.12;
        osc.start(start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.stop(start + 0.4);
      });
    } catch (e) { /* Web Audio unavailable; fail silently */ }
  },

  confettiBurst() {
    const emojis = ['🎉', '⭐', '✨', '🎊'];
    for (let i = 0; i < 14; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 2200);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
