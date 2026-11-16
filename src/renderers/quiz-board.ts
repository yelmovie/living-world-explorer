import {assignCard} from '../inquiry-actions';
import type {InquiryItem, InquiryRecord, InquiryTask} from '../inquiry-model';
import {artFor, artKey, artTime} from '../artAssets';
import {playEffect} from '../audio';
import {canvas, draw} from '../draw';
import {el, button} from '../ui';
import type {InquiryHooks, InquiryView} from './inquiry2d';
import {totoSay} from '../toto-hint';
import '../quiz-board.css';

const questions: Record<string, string> = {
  'M1-1': '여기서 찾은 건 무엇일까요?',
  'M3-1': '확인한 자료인가요, 아직 확인하지 않은 생각인가요?',
  'M3-2': '이 자료는 세균의 어떤 특징을 알려 주나요?',
  'M3-3': '세균을 발견한 장소를 알 수 있나요?',
  'M4-3': '이 상황에서 어떤 영향을 주나요?',
  'M4-4': '이 상황에서 어떤 영향을 주나요?'
};

export function picture(item: InquiryItem) {
  const kind = artKey(item);
  const art = artFor(kind, artTime(kind, item.detail, item.id));
  if (art) {
    const image = el('img');
    image.src = art.src;
    image.alt = '';
    image.draggable = false;
    return image;
  }
  const sketch = canvas(480, 300);
  draw(sketch, kind || 'question', {});
  sketch.setAttribute('aria-hidden', 'true');
  return sketch;
}

/** Saved assignments remain compatible with the earlier card activity. */
export function mountQuizBoard(host: HTMLElement, task: InquiryTask, record: InquiryRecord, hooks: InquiryHooks): InquiryView {
  const items = task.items.filter(item => record.v === 2 || item.since !== 2);
  const correct = (item: InquiryItem) => record.assignments[item.id] === item.target;
  const pending = items.findIndex(item => !correct(item) || !record.opened.includes(item.id));
  let index = pending < 0 ? items.length - 1 : pending;
  let disposed = false;
  let ready = false;
  const pictures = items.map(picture);

  const board = el('section', 'quiz-board');
  board.dataset.task = task.id;
  board.inert = true;
  const progress = el('div', 'quiz-progress');
  const position = el('span');
  const count = el('span');
  progress.append(position, count);

  const content = el('div', 'quiz-content');
  const figure = el('figure', 'quiz-figure');
  const photo = el('div', 'quiz-photo');
  const caption = el('figcaption');
  figure.append(photo, caption);

  const answer = el('div', 'quiz-answer');
  const question = el('h3', 'quiz-question', questions[task.id]);
  question.id = 'quiz-question';
  question.tabIndex = -1;
  const detail = el('p', 'quiz-detail');
  const choices = el('div', 'quiz-choices');
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-labelledby', question.id);
  const feedback = el('p', 'quiz-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-atomic', 'true');

  const options = task.targets.map(target => {
    const option = button(target.label, () => assign(items[index].id, target.id), 'secondary quiz-option');
    option.dataset.quizAnswer = target.id;
    choices.append(option);
    return {target, option};
  });
  answer.append(question, detail, choices, feedback);
  content.append(figure, answer);

  const navigation = el('div', 'quiz-navigation');
  const previous = button('이전 문제', () => show(index - 1, true), 'secondary');
  const next = button('다음 문제', () => {
    if (correct(items[index])) show(index + 1, true);
  }, 'primary');
  const finish = el('p', 'quiz-finish');
  navigation.append(previous, finish, next);
  board.append(progress, content, navigation);
  host.append(board);

  function refresh() {
    if (disposed) return;
    const item = items[index];
    const selected = record.assignments[item.id];
    const solved = correct(item);
    position.textContent = `문제 ${index + 1} / ${items.length}`;
    count.textContent = `${items.filter(correct).length}개 완료`;
    board.dataset.quizItem = item.id;

    for (const {target, option} of options) {
      const chosen = selected === target.id;
      option.setAttribute('aria-pressed', String(chosen));
      // Keep the selected answer focusable while preventing completed answers from changing.
      option.setAttribute('aria-disabled', String(solved));
      option.classList.toggle('is-correct', chosen && solved);
      option.classList.toggle('is-wrong', chosen && !solved);
    }
    feedback.dataset.state = solved ? 'correct' : selected ? 'retry' : 'waiting';
    feedback.textContent = solved ? '맞았어요!' : selected ? `다시 골라봐요. ${task.feedback}` : '답을 하나 골라요.';
    previous.disabled = index === 0;
    // 2026-11-16: right answers advance by themselves, so '다음 문제' only shows when revisiting a solved question.
    next.hidden = index === items.length - 1 || !solved;
    next.disabled = !solved;
    finish.hidden = index !== items.length - 1 || !items.every(correct);
    finish.textContent = task.id === 'M3-2' && record.v === 2 && record.assignments.ladder !== 'smallest'
      ? '문제를 다 풀었어요. 크기 사다리도 살펴봐요.'
      : '모두 풀었어요. 발견을 기록해요.';
  }

  function show(nextIndex: number, focus = false) {
    if (disposed || nextIndex < 0 || nextIndex >= items.length) return;
    index = nextIndex;
    const item = items[index];
    photo.replaceChildren(pictures[index]);
    caption.textContent = item.label;
    detail.textContent = item.detail;
    hooks.open(item.id);
    refresh();
    board.scrollTop = 0;
    if (focus) {
      question.focus({preventScroll: true});
      host.closest('.expedition-shell')?.scrollTo({top: 0, behavior: 'instant'});
    }
  }

  function assign(id: string, target: string) {
    const item = items[index];
    if (!ready || disposed || document.hidden || document.querySelector('dialog[open]') || id !== item.id || correct(item)) return false;
    const changed = assignCard(task, record, id, target);
    if (!changed) return false;
    if (!correct(item)) record.misses++;
    hooks.assigned(id, target);
    hooks.changed();
    refresh();
    playEffect(correct(item) ? 'snap' : 'retry');
    // 2026-11-16: Toto reacts (tasks with hints), and a right answer moves on by itself instead of waiting for '다음 문제'.
    if (task.hints) {
      totoSay(board, correct(item)
        ? {text: '딩동댕! ' + (index < items.length - 1 ? '다음 자료도 볼까?' : '다 풀었어!'), mood: 'cheer'}
        : {text: item.hint || task.hints[0], mood: 'hint'});
    }
    if (correct(item) && index < items.length - 1) {
      const from = index;
      setTimeout(() => { if (!disposed && index === from) show(index + 1, true); }, 900);
    }
    return true;
  }

  show(index);
  const images = pictures.filter((node): node is HTMLImageElement => node instanceof HTMLImageElement);
  void Promise.all(images.map(image => image.decode())).then(() => {
    if (disposed) return;
    ready = true;
    board.inert = false;
    hooks.ready(true);
  }, () => {
    if (!disposed) hooks.ready(false);
  });

  const idle = () => {};
  return {
    showFrame: idle, endDemo: idle, setPlaybackRate: idle, setPreview: idle,
    setReveal: idle, setPlaying: idle, arm: idle,
    animateRun: (_valid, finish) => finish(),
    refresh, assignCard: assign, assign, place: assign,
    dispose: () => {
      disposed = true;
      board.remove();
    }
  };
}
