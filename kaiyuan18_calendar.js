#!/usr/bin/env node

/**
 * 计算并输出开元十八年（对应农历 relatedYear=730）每日信息：
 * - 公历日期
 * - 农历日期
 * - 干支（年/月/日）
 * - 五行建除（纳音 + 建除十二神）
 * - 若为星期日，则在行首增加“蜜”字
 */

const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const JIAN_CHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];
const NAYIN_30 = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '砂中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
];


const LUNAR_DAY_NAMES = [
  '',
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

const MONTH_NAME_MAP = {
  '正月': 1,
  '二月': 2,
  '三月': 3,
  '四月': 4,
  '五月': 5,
  '六月': 6,
  '七月': 7,
  '八月': 8,
  '九月': 9,
  '十月': 10,
  '冬月': 11,
  '腊月': 12,
  '十一月': 11,
  '十二月': 12,
};

function toJdn(y, m, d) {
  let a = Math.floor((14 - m) / 12);
  let yy = y + 4800 - a;
  let mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// 以 1984-02-02 为甲子日进行标定
const JIA_ZI_JDN = toJdn(1984, 2, 2);
const DAY_GZ_OFFSET = (60 - (JIA_ZI_JDN % 60)) % 60;

function dayGanzhiIndex(y, m, d) {
  const jdn = toJdn(y, m, d);
  return (jdn + DAY_GZ_OFFSET) % 60;
}

function gzFromIndex(idx) {
  return TG[idx % 10] + DZ[idx % 12];
}

function nayinFromDayIndex(idx) {
  return NAYIN_30[Math.floor(idx / 2) % 30];
}

function parseYearStemIndex(yearName) {
  const stem = yearName[0];
  return TG.indexOf(stem);
}

function parseLunarMonth(monthText) {
  const isLeap = monthText.startsWith('闰');
  const core = isLeap ? monthText.slice(1) : monthText;
  const num = MONTH_NAME_MAP[core];
  if (!num) throw new Error(`无法解析农历月份：${monthText}`);
  return { monthNum: num, isLeap };
}

// 年上起月：甲己年丙作首，乙庚年戊作首，丙辛年庚作首，丁壬年壬作首，戊癸年甲作首
function firstMonthStemIndex(yearStemIndex) {
  if ([0, 5].includes(yearStemIndex)) return 2; // 丙
  if ([1, 6].includes(yearStemIndex)) return 4; // 戊
  if ([2, 7].includes(yearStemIndex)) return 6; // 庚
  if ([3, 8].includes(yearStemIndex)) return 8; // 壬
  return 0; // 戊癸 -> 甲
}

function monthGanzhi(yearStemIndex, monthNum) {
  const stemStart = firstMonthStemIndex(yearStemIndex);
  const stemIdx = (stemStart + monthNum - 1) % 10;
  const branchIdx = (monthNum + 1) % 12; // 正月寅(2)
  return {
    text: TG[stemIdx] + DZ[branchIdx],
    branchIdx,
  };
}

function jianChu(monthBranchIdx, dayBranchIdx) {
  const idx = (dayBranchIdx - monthBranchIdx + 12) % 12;
  return JIAN_CHU[idx];
}

function fmt2(n) {
  return String(n).padStart(2, '0');
}

function main() {
  const fmt = new Intl.DateTimeFormat('zh-Hans-CN-u-ca-chinese', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'UTC',
  });

  const start = new Date(Date.UTC(729, 11, 1));
  const end = new Date(Date.UTC(731, 2, 1));

  const lines = [];
  lines.push('开元十八年（农历 relatedYear=730）逐日历表');
  lines.push('字段：公历 | 农历 | 干支(年/月/日) | 五行建除');

  for (let t = start.getTime(); t < end.getTime(); t += 86400000) {
    const date = new Date(t);
    const parts = fmt.formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';

    const relatedYear = Number(get('relatedYear'));
    if (relatedYear !== 730) continue;

    const yearName = get('yearName');
    const monthText = get('month');
    const dayNum = Number(get('day'));
    const weekday = get('weekday');

    const { monthNum, isLeap } = parseLunarMonth(monthText);
    const yStemIdx = parseYearStemIndex(yearName);
    const monthGz = monthGanzhi(yStemIdx, monthNum);

    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const dIdx = dayGanzhiIndex(y, m, d);
    const dayGz = gzFromIndex(dIdx);
    const dayBranchIdx = dIdx % 12;

    const jc = jianChu(monthGz.branchIdx, dayBranchIdx);
    const nayin = nayinFromDayIndex(dIdx);

    const prefix = weekday === '星期日' ? '蜜' : ' ';
    const dayCn = LUNAR_DAY_NAMES[dayNum] || String(dayNum);
    const lunarLabel = `${yearName}年${isLeap ? '闰' : ''}${monthText.replace(/^闰/, '')}${dayCn}`;
    lines.push(
      `${prefix}${y}-${fmt2(m)}-${fmt2(d)} ${weekday} | ${lunarLabel} | ${yearName}/${monthGz.text}/${dayGz} | ${nayin}${jc}`
    );
  }

  console.log(lines.join('\n'));
}

main();
