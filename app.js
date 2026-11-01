'use strict';

const API_URL = 'https://script.google.com/macros/s/AKfycbztsD6qumI0hYof9mOQw-oy5werAH2s3HGa313QekPfFvVaCW1qgytps-LD-WCeynCQ/exec';

const TIMEOUT_MS = 15000;
const RETRIES = 2;

const $ = id => document.getElementById(id);
const views = { loading: $('v-loading'), found: $('v-found'), none: $('v-none') };
const btn = document.querySelector('#v-form button');
const show = name => { for (const k in views) views[k].hidden = (k !== name); };

let dotTimer;
function startDots() {
  let n = 0;
  clearInterval(dotTimer);
  dotTimer = setInterval(() => { n = (n + 1) % 4; $('dots').textContent = '.'.repeat(n); }, 400);
}

async function lookup(room, no) {
  const url = API_URL + '?room=' + encodeURIComponent(room) + '&no=' + encodeURIComponent(no);
  for (let i = 0; i <= RETRIES; i++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) throw new Error('http ' + res.status);
      return await res.json();
    } catch (err) {
      if (i === RETRIES) throw err;
      await new Promise(r => setTimeout(r, 800 * (i + 1) + Math.random() * 700));
    } finally {
      clearTimeout(timer);
    }
  }
}

$('v-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const room = $('room').value.trim();
  const noRaw = $('no').value.trim();
  const msg = $('v-msg');
  if (!((room >= 931 && room <= 937) || (room >= 941 && room <= 943) || (room >= 945 && room <= 947)) && (noRaw >= 1 && noRaw <=41)) {
    msg.textContent = 'กรุณากรอกห้องเรียนให้ถูกต้อง';
    msg.hidden = false;
    show('');
    return;
  }
  if (((room >= 931 && room <= 937) || (room >= 941 && room <= 943) || (room >= 945 && room <= 947)) && !(noRaw >= 1 && noRaw <=41)) {
    msg.textContent = 'กรุณากรอกเลขที่ให้ถูกต้อง';
    msg.hidden = false;
    show('');
    return;
  }
  if (!((room >= 931 && room <= 937) || (room >= 941 && room <= 943) || (room >= 945 && room <= 947)) && !(noRaw >= 1 && noRaw <=41)) {
    msg.textContent = 'กรุณากรอกห้องเรียนและเลขที่ให้ถูกต้อง';
    msg.hidden = false;
    show('');
    return;
  }
  if (!API_URL.startsWith('https://script.google.com/')) {
    msg.textContent = 'ยังไม่ได้ตั้งค่าลิงก์ API ในไฟล์ app.js';
    msg.hidden = false;
    return;
  }
  msg.hidden = true;
  const no = String(parseInt(noRaw, 10));
  btn.disabled = true;
  show('loading');
  startDots();
  try {
    const d = await lookup(room, no);
    if (d && d.status === 'ok') {
      $('r-name').textContent = d.name;
      $('r-room').textContent = 'ห้อง ' + room + ' เลขที่ ' + no;
      $('r-duty').textContent = d.duty || 'ยังไม่มีข้อมูลหน้าที่';
      show('found');
    } else {
      show('none');
    }
  } catch (err) {
    show('none');
  } finally {
    clearInterval(dotTimer);
    btn.disabled = false;
  }
});