'use strict';

const loom = window.LoomWorkshop;
const select = (id) => document.getElementById(id);
const status = select('status');
const startButton = select('start');
const resetButton = select('reset');
const choices = select('choices');
const floatMeter = select('float-meter');
const dialog = select('instructions');
const descriptions = { '0': '生成り', '1': '青緑', '.': '自由', ' ': '未織り' };
const cellClasses = { '0': 'light', '1': 'dark', '.': 'free', ' ': 'empty' };
let game = loom.initial();

function renderRow(pattern, index, display, isCurrent, highlights = [], failures = []) {
  const row = document.createElement('div');
  row.className = 'board-row';
  row.dataset.row = index + 1;
  row.classList.toggle('current', isCurrent);
  row.classList.toggle('failed', failures.length > 0);
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', [
    display + (index + 1) + '段目',
    [...pattern].map((value) => descriptions[value]).join('、'),
    highlights.length ? '糸の浮き注意 ' + columnLabel(highlights) : '',
    failures.length ? '失敗箇所 ' + columnLabel(failures) : '',
  ].filter(Boolean).join('。'));
  row.setAttribute('aria-current', isCurrent ? 'step' : 'false');
  for (const [column, value] of [...pattern].entries()) {
    const cell = document.createElement('span');
    cell.className = 'cell ' + cellClasses[value];
    cell.classList.toggle('danger', highlights.includes(column));
    cell.classList.toggle('error', failures.includes(column));
    if (failures.includes(column)) cell.textContent = '×';
    else if (highlights.includes(column)) cell.textContent = '!';
    else if (value === '.') cell.textContent = '・';
    row.append(cell);
  }
  return row;
}

function columnLabel(columns) {
  return columns.map((column) => column + 1).join('・') + '列目';
}

function render() {
  const rowCount = game.cloth.length;
  const playing = game.phase === 'playing';
  const finalRow = rowCount - 1;
  const warningColumns = game.streaks.flatMap((count, column) => count === loom.floatLimit - 1 ? [column] : []);
  select('row-count').textContent = rowCount + ' / ' + loom.sample.length + ' 段';
  select('float-count').textContent = game.maxFloat + ' / ' + loom.floatLimit;
  floatMeter.classList.toggle('danger', game.maxFloat >= loom.floatLimit - 1);
  select('progress-dots').replaceChildren(...loom.sample.map((value, index) => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.classList.toggle('filled', index < rowCount);
    dot.classList.toggle('current', playing && index === rowCount);
    return dot;
  }));
  select('sample-board').replaceChildren(...loom.sample.map((pattern, index) => renderRow(
    pattern, index, '見本の', playing && index === rowCount, [],
    index === finalRow && game.reason === 'sample' ? game.columns : [],
  )));
  select('cloth-board').replaceChildren(...loom.sample.map((value, index) => renderRow(
    game.cloth[index] ?? '      ', index, '織り布の', playing && index === rowCount,
    index === finalRow && playing ? warningColumns : [],
    index === finalRow ? game.columns : [],
  )));

  status.dataset.phase = game.phase;
  if (game.phase === 'ready') {
    status.textContent = '色を合わせ、同じ列で同じ色を4段続けずに織ろう。';
  } else if (game.phase === 'won') {
    status.textContent = '織り上がり！ 見本に沿って8段を織れました。';
  } else if (game.reason === 'sample') {
    status.textContent = rowCount + '段目の' + columnLabel(game.columns) + 'が見本と違います。';
  } else if (game.reason === 'float') {
    status.textContent = columnLabel(game.columns) + 'で同じ色が4段続き、糸が浮きました。';
  } else if (warningColumns.length) {
    status.textContent = (rowCount + 1) + '段目。「!」の列と、次の見本を確認。';
  } else {
    status.textContent = (rowCount + 1) + '段目。見本の色に合わせて織ろう。';
  }
  choices.hidden = !playing;
  resetButton.hidden = !playing || rowCount === 0;
  startButton.hidden = playing;
  startButton.textContent = game.phase === 'ready' ? '織り始める' : 'もう一度織る';
}

function startGame() {
  game = loom.start();
  render();
  choices.firstElementChild.focus({ preventScroll: true });
}

function handleChoice(index) {
  game = loom.weave(game, index);
  render();
  if (game.phase !== 'playing') startButton.focus({ preventScroll: true });
}

loom.patterns.forEach((pattern, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.dataset.choice = index;
  button.setAttribute('aria-label', pattern.name + '。' + [...pattern.cells]
    .map((value) => descriptions[value]).join('、'));
  button.setAttribute('aria-keyshortcuts', String(index + 1));
  const label = document.createElement('span');
  label.textContent = pattern.name;
  const preview = document.createElement('span');
  preview.className = 'choice-preview';
  preview.setAttribute('aria-hidden', 'true');
  for (const value of pattern.cells) {
    const cell = document.createElement('span');
    cell.className = 'cell ' + cellClasses[value];
    preview.append(cell);
  }
  button.append(label, preview);
  button.addEventListener('click', () => handleChoice(index));
  choices.append(button);
});

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', startGame);
select('help-open').addEventListener('click', () => dialog.showModal());
document.addEventListener('keydown', (event) => {
  if (dialog.open || game.phase !== 'playing' || event.repeat || event.ctrlKey || event.altKey
    || event.metaKey || !/^[1-4]$/.test(event.key)) return;
  event.preventDefault();
  handleChoice(Number(event.key) - 1);
});
render();
