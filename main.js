'use strict';
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Открыть меню');
  nav.classList.remove('open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.classList.toggle('open', open);
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => {
  if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menu.focus();
  }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

// Each film stays in its original sequence; play one film at a time.
const films = [...document.querySelectorAll('video')];
films.forEach(film => {
  const frame = film.closest('.video-frame');
  const start = frame.querySelector('.video-start');
  if (start) {
    start.hidden = false;
    start.addEventListener('click', () => {
      film.play().catch(() => {
        start.hidden = true;
        film.focus();
      });
    });
  }
  film.addEventListener('play', () => {
    films.forEach(other => { if (other !== film) other.pause(); });
    frame.classList.add('playing', 'started');
  });
  film.addEventListener('pause', () => film.closest('.video-frame').classList.remove('playing'));
  film.addEventListener('ended', () => film.closest('.video-frame').classList.remove('playing'));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) films.forEach(film => film.pause());
});

// Show the current section without hiding any content or changing history.
const links = [...nav.querySelectorAll('a[href^="#"]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-18% 0px -55% 0px' });
  ['help','methods','about','contact'].forEach(id => { const target = document.getElementById(id); if (target) observer.observe(target); });
}

// A topic selector runs entirely in this page. It does not store or submit answers.
const quiz = document.getElementById('contact-quiz');
if (quiz) {
  const contact = document.getElementById('contact');
  const questions = [
    { title: 'Кому нужна консультация?', label: 'Кому', choices: ['Мне', 'Близкому человеку', 'Ребёнку', 'Спортсмену'] },
    { title: 'С чем связано обращение?', label: 'Тема', choices: [
      'После инсульта или неврологического заболевания',
      'Боль, ограничения движения или последствия травмы',
      'Память, Паркинсон или возрастные изменения',
      'Детская неврология и развитие',
      'Спорт и возвращение к нагрузкам',
      'Сон, усталость или стресс',
      'Сосудистые и метаболические риски',
      'Другой вопрос / пока не знаю'
    ] },
    { title: 'Что вы хотите узнать?', label: 'Вопрос', choices: ['Возможность консультации', 'Какие методы применяются', 'Как организована работа', 'Другой вопрос'] }
  ];
  const answers = [null, null, null];
  let step = 0;
  const progress = document.getElementById('quiz-progress');
  const track = [...quiz.querySelectorAll('.quiz-track span')];
  const question = document.getElementById('quiz-question');
  const options = document.getElementById('quiz-options');
  const back = document.getElementById('quiz-back');
  const stepPanel = document.getElementById('quiz-step');
  const result = document.getElementById('quiz-result');
  const summary = document.getElementById('quiz-summary');
  const resultTitle = document.getElementById('quiz-result-title');
  const email = document.getElementById('quiz-email');
  const emailAddress = contact.dataset.contactEmail;

  function focusHeading(target) {
    target.focus({ preventScroll: true });
    const bounds = target.getBoundingClientRect();
    if (bounds.top < 112 || bounds.bottom > window.innerHeight - 24) {
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  function render(focus = true) {
    const finished = step === questions.length;
    progress.textContent = finished ? 'Готово' : `Шаг ${step + 1} из ${questions.length}`;
    track.forEach((part, index) => {
      part.classList.toggle('is-current', !finished && index === step);
      part.classList.toggle('is-done', index < step);
    });
    stepPanel.hidden = finished;
    result.hidden = !finished;
    if (finished) {
      summary.replaceChildren();
      questions.forEach((item, index) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const value = document.createElement('dd');
        term.textContent = item.label;
        value.textContent = answers[index];
        row.append(term, value);
        summary.append(row);
      });
      if (emailAddress) {
        const body = 'Здравствуйте!\nХочу обратиться к Ринату Акбарову.\n\n' +
          questions.map((item, index) => `${item.label}: ${answers[index]}`).join('\n');
        email.href = 'mailto:' + emailAddress + '?subject=' + encodeURIComponent('Обращение к Ринату Акбарову') + '&body=' + encodeURIComponent(body);
        email.hidden = false;

      }
      if (focus) focusHeading(resultTitle);
    } else {
      const item = questions[step];
      question.textContent = item.title;
      options.classList.toggle('long-options', step === 1);
      options.replaceChildren();
      item.choices.forEach(choice => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-choice';
        button.textContent = choice;
        button.setAttribute('aria-pressed', String(answers[step] === choice));
        button.addEventListener('click', () => {
          answers[step] = choice;
          step += 1;
          render();
        });
        options.append(button);
      });
      back.hidden = step === 0;
      if (focus) focusHeading(question);
    }
  }
  back.addEventListener('click', () => { if (step > 0) { step -= 1; render(); } });
  document.getElementById('quiz-reset').addEventListener('click', () => {
    answers.fill(null);
    summary.replaceChildren();
    email.href = 'mailto:' + (emailAddress || '');
    email.hidden = true;
    step = 0;

    render();
  });
  quiz.hidden = false;
  render(false);
}
