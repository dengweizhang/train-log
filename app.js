const workouts = [...window.WORKOUTS].sort((a, b) => b.date.localeCompare(a.date));
const byId = id => document.getElementById(id);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const monthFmt = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', timeZone: 'UTC'
});
const dayFmt = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric', day: 'numeric', weekday: 'long', timeZone: 'UTC'
});
const parseDate = value => new Date(`${value}T00:00:00Z`);
const dateKey = date => date.toISOString().slice(0, 10);
const isCardio = item => /骑行|公路车|爬坡/.test(item[0]);
const todayParts = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai'
}).formatToParts(new Date());
const today = ['year', 'month', 'day']
  .map(part => todayParts.find(value => value.type === part).value).join('-');
const workoutsByDate = new Map();
for (const workout of workouts) {
  const existing = workoutsByDate.get(workout.date);
  if (existing) existing.items.push(...workout.items);
  else workoutsByDate.set(workout.date, { date: workout.date, items: [...workout.items] });
}
const latestDate = workouts[0]?.date || today;
let selectedDate = latestDate;
let displayedMonth = latestDate.slice(0, 7);

function cardioMinutes(entries = workouts) {
  let total = 0;
  for (const workout of entries) {
    for (const item of workout.items) {
      if (!isCardio(item)) continue;
      const minutes = item[2].match(/(\d+(?:\.\d+)?)\s*min/i);
      if (minutes) total += +minutes[1];
      const hours = item[2].match(/(\d+(?:\.\d+)?)\s*h/i);
      if (hours) total += +hours[1] * 60;
    }
  }
  return total;
}

function totalExercises() {
  return workouts.reduce((count, workout) => count + workout.items.length, 0);
}

function renderStats() {
  const stats = [
    [String(workouts.length), '训练日'],
    [String(totalExercises()), '动作记录'],
    [`${cardioMinutes()} min`, '已记录有氧'],
    [workouts[0] ? latestDate.slice(5).replace('-', '/') : '—', '最近训练']
  ];
  byId('stats').innerHTML = stats.map(([value, label]) =>
    `<div class="stat"><span class="stat-value">${escapeHtml(value)}</span><span class="stat-label">${escapeHtml(label)}</span></div>`
  ).join('');
}

function renderCalendar() {
  const firstDay = parseDate(`${displayedMonth}-01`);
  const monthDays = [...workoutsByDate.values()].filter(workout =>
    workout.date.slice(0, 7) === displayedMonth
  );
  byId('calendarTitle').textContent = monthFmt.format(firstDay);
  byId('monthSummary').textContent = `${monthDays.length} 个训练日 · ${monthDays.reduce((count, workout) => count + workout.items.length, 0)} 项动作`;
  byId('monthPicker').value = displayedMonth;

  const offset = (firstDay.getUTCDay() + 6) % 7;
  const followingMonth = new Date(firstDay);
  followingMonth.setUTCMonth(followingMonth.getUTCMonth() + 1);
  followingMonth.setUTCDate(0);
  const cellCount = Math.ceil((offset + followingMonth.getUTCDate()) / 7) * 7;
  const startDate = new Date(firstDay);
  startDate.setUTCDate(1 - offset);

  byId('calendarGrid').innerHTML = Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    const key = dateKey(date);
    const workout = workoutsByDate.get(key);
    const count = workout?.items.length || 0;
    const selected = key === selectedDate;
    const classes = [
      'calendar-day',
      key.slice(0, 7) !== displayedMonth && 'outside-month',
      workout && 'has-workout',
      selected && 'is-selected',
      key === today && 'is-today'
    ].filter(Boolean).join(' ');
    const label = `${key} ${dayFmt.format(date)}，${workout ? `${count} 项动作` : '暂无训练记录'}${key === today ? '，今天' : ''}`;
    return `<button type="button" class="${classes}" data-date="${escapeHtml(key)}" tabindex="${selected ? 0 : -1}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}"${key === today ? ' aria-current="date"' : ''}><span class="day-number">${date.getUTCDate()}</span>${workout ? `<span class="day-count">${count}项</span><span class="workout-dot" aria-hidden="true"></span>` : ''}</button>`;
  }).join('');
}

function renderDayDetail() {
  const workout = workoutsByDate.get(selectedDate);
  const heading = `<div class="detail-heading"><p class="eyebrow">${escapeHtml(selectedDate)}</p><h2>${escapeHtml(dayFmt.format(parseDate(selectedDate)))}</h2></div>`;
  if (!workout) {
    byId('dayDetail').innerHTML = `${heading}<div class="empty-state"><p>暂无训练记录</p><span>选择有标记的日期，查看当天训练。</span></div>`;
    return;
  }
  const cardioItems = workout.items.filter(isCardio);
  const minutes = cardioMinutes([workout]);
  const cardioLabel = cardioItems.some(item => !/(\d+(?:\.\d+)?)\s*(min|h)\b/i.test(item[2]))
    ? (minutes ? `已记录有氧 ${minutes} min · 部分时长未记录` : '有氧时长未记录')
    : `已记录有氧 ${minutes} min`;
  byId('dayDetail').innerHTML = `${heading}<p class="detail-meta">${workout.items.length} 项动作 · ${escapeHtml(cardioLabel)}</p><table class="workout-table"><thead><tr><th scope="col">动作</th><th scope="col">重量</th><th scope="col">组数 · 次数</th></tr></thead><tbody>${workout.items.map(item => `<tr><td class="exercise-name">${escapeHtml(item[0])}</td><td class="exercise-load">${escapeHtml(item[1])}</td><td class="exercise-volume">${escapeHtml(item[2])}</td></tr>`).join('')}</tbody></table>`;
}

function selectDate(value, focusDate = false) {
  selectedDate = value;
  displayedMonth = value.slice(0, 7);
  renderCalendar();
  renderDayDetail();
  if (focusDate) {
    [...byId('calendarGrid').querySelectorAll('.calendar-day')]
      .find(button => button.dataset.date === selectedDate)?.focus();
  }
}

function selectMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value)) return;
  const date = parseDate(`${value}-01`);
  if (Number.isNaN(date.getTime()) || dateKey(date).slice(0, 7) !== value) return;
  const latestInMonth = workouts.find(workout => workout.date.slice(0, 7) === value);
  selectDate(latestInMonth?.date || `${value}-01`);
}

function changeMonth(amount) {
  const date = parseDate(`${displayedMonth}-01`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  selectMonth(dateKey(date).slice(0, 7));
}

function loadNum(value) {
  const match = value.match(/([\d.]+)\s*kg/);
  return match ? +match[1] : null;
}

const progressDefs = [
  { title: '辅助引体', matches: name => name === '辅助引体', inverse: true, note: '辅助重量越低越强' },
  { title: '坐姿腿弯举', matches: name => name === '坐姿腿弯举' },
  { title: '坐姿髋外展', matches: name => name === '坐姿髋外展' },
  { title: '飞鸟', matches: name => name === '飞鸟' || name === '坐姿飞鸟' },
  { title: '划船', matches: name => name.includes('划船') },
  { title: '罗马尼亚硬拉', matches: name => name === '罗马尼亚硬拉' }
];

function series(definition) {
  const result = [];
  [...workouts].reverse().forEach(workout => workout.items.forEach(item => {
    if (definition.matches(item[0])) {
      const value = loadNum(item[1]);
      if (value !== null) result.push({ date: workout.date, value });
    }
  }));
  return result;
}

function svgFor(data, inverse) {
  if (data.length < 2) return '';
  const width = 420, height = 110, padding = 10;
  const values = data.map(point => point.value);
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(1, max - min);
  const points = data.map((point, index) => {
    const x = padding + index * (width - 2 * padding) / Math.max(1, data.length - 1);
    let ratio = (point.value - min) / span;
    if (inverse) ratio = 1 - ratio;
    const y = height - padding - ratio * (height - 2 * padding);
    return [x, y];
  });
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><line class="chart-line" x1="0" y1="${height - 10}" x2="${width}" y2="${height - 10}"/><path d="${path}"/>${points.map(point => `<circle cx="${point[0]}" cy="${point[1]}" r="3"/>`).join('')}</svg>`;
}

function renderProgress() {
  byId('progressGrid').innerHTML = progressDefs.map(definition => {
    const data = series(definition);
    if (!data.length) return '';
    const first = data[0], last = data[data.length - 1];
    const best = definition.inverse ? Math.min(...data.map(point => point.value)) : Math.max(...data.map(point => point.value));
    return `<article class="progress-card"><h3>${escapeHtml(definition.title)}</h3><div class="progress-sub">${escapeHtml(definition.note || `${data.length} 次带重量记录`)}</div><div class="metric-row"><div class="metric"><strong>${first.value} kg</strong><span>起点 · ${escapeHtml(first.date.slice(5))}</span></div><div class="metric"><strong>${last.value} kg</strong><span>最近 · ${escapeHtml(last.date.slice(5))}</span></div><div class="metric"><strong>${best} kg</strong><span>${definition.inverse ? '最低辅助' : '最高记录'}</span></div></div>${svgFor(data, definition.inverse)}</article>`;
  }).join('');
}

const tabs = [...document.querySelectorAll('.tab')];
function activateTab(tab) {
  tabs.forEach(button => {
    const active = button === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    const panel = byId(button.dataset.target);
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let targetIndex;
    if (event.key === 'ArrowRight') targetIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') targetIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') targetIndex = 0;
    else if (event.key === 'End') targetIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    activateTab(tabs[targetIndex]);
    tabs[targetIndex].focus();
  });
});

byId('calendarGrid').addEventListener('click', event => {
  const button = event.target.closest('.calendar-day');
  if (button) selectDate(button.dataset.date, true);
});
byId('calendarGrid').addEventListener('keydown', event => {
  const button = event.target.closest('.calendar-day');
  if (!button) return;
  const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
  if (offset === undefined) return;
  event.preventDefault();
  const date = parseDate(button.dataset.date);
  date.setUTCDate(date.getUTCDate() + offset);
  selectDate(dateKey(date), true);
});
byId('prevMonth').addEventListener('click', () => changeMonth(-1));
byId('nextMonth').addEventListener('click', () => changeMonth(1));
byId('monthPicker').addEventListener('change', event => selectMonth(event.target.value));
byId('latestMonth').addEventListener('click', () => selectDate(latestDate));

renderStats();
renderCalendar();
renderDayDetail();
renderProgress();
activateTab(tabs.find(tab => tab.classList.contains('active')) || tabs[0]);
