/**
 * Adds a "Matches" tab to Contract Log – Seller Leads.
 * It compares every buyer on the Buyers tab with every seller on the Sellers tab
 * and lists the pairs that could fit, best first. Run it again any time to refresh.
 * Your own Status / Notes entries are kept when you re-run it.
 *
 * How to use: open the sheet > Extensions > Apps Script > paste this file >
 * Save > pick buildMatches > Run (approve the permission prompt once).
 */
function buildMatches() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sellers = readTab_(ss, 'Sellers');
  var buyers = readTab_(ss, 'Buyers');

  var out = ss.getSheetByName('Matches') || ss.insertSheet('Matches');

  // Keep any Status / Your notes already typed in, keyed by buyer + seller.
  var kept = {};
  if (out.getLastRow() > 1) {
    out.getRange(2, 1, out.getLastRow() - 1, 12).getValues().forEach(function (r) {
      kept[r[0] + '|' + r[1]] = [r[10], r[11]];
    });
  }

  var rows = [];
  buyers.forEach(function (b) {
    if (!b['Name']) return;
    sellers.forEach(function (s) {
      if (!s['Name']) return;
      var m = score_(b, s);
      if (m.score < 2) return; // skip clear non-fits
      var k = kept[b['Name'] + '|' + s['Name']] || ['', ''];
      rows.push([
        b['Name'], s['Name'], m.score,
        b["Men's / Women's"], s["Men's / Women's"],
        b['Room'] + ' / ' + s['Room'],
        b['Budget/mo'] + ' / ' + s['Rent/mo'],
        b['Move-in'] + ' / ' + s['Available from'],
        s['Complex'],
        m.why.join('; '),
        k[0] || 'Not contacted', k[1]
      ]);
    });
  });
  rows.sort(function (a, b) { return b[2] - a[2]; });

  var headers = ['Buyer', 'Seller', 'Fit score (0-5)', "Buyer M/W", "Seller M/W",
    'Room (buyer / seller)', 'Budget / rent', 'Move-in / available', 'Complex',
    'Why it fits', 'Status', 'Your notes'];
  out.clear();
  out.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#d9ead3');
  if (rows.length) out.getRange(2, 1, rows.length, headers.length).setValues(rows);
  out.setFrozenRows(1);

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Not contacted', 'Sent to buyer', 'Buyer interested',
      'Intro made', 'Signed', 'Not a fit'], true).build();
  if (rows.length) out.getRange(2, 11, rows.length, 1).setDataValidation(statusRule);
  out.autoResizeColumns(1, 9);
  out.setColumnWidth(10, 320);
  out.setColumnWidth(12, 260);
}

function readTab_(ss, name) {
  var v = ss.getSheetByName(name).getDataRange().getDisplayValues();
  var h = v[0];
  return v.slice(1).map(function (r) {
    var o = {};
    h.forEach(function (col, i) { o[col] = String(r[i] || ''); });
    return o;
  });
}

// One point each for gender, room type, budget, move-in, BYU approval.
function score_(b, s) {
  var score = 0, why = [];

  var bg = gender_(b["Men's / Women's"]), sg = gender_(s["Men's / Women's"]);
  if (bg && sg && bg !== sg) return { score: -1, why: [] }; // hard no
  if (bg && sg) { score++; why.push('Same gender (' + sg + ')'); }
  else { score += 0.5; why.push('Gender not confirmed'); }

  var br = room_(b['Room']), sr = room_(s['Room']);
  if (!br || !sr || br === 'either' || br === sr) {
    score++; if (br && sr) why.push('Room type fits (' + sr + ')');
  } else { why.push('Room type differs'); }

  var budget = maxNum_(b['Budget/mo']), rent = firstNum_(s['Rent/mo']);
  if (budget && rent) {
    if (rent <= budget + 25) { score++; why.push('Rent $' + rent + ' within budget $' + budget); }
    else why.push('Rent $' + rent + ' over budget $' + budget);
  } else score += 0.5;

  var bm = month_(b['Move-in']), sm = month_(s['Available from']);
  if (bm && sm) {
    if (sm <= bm) { score++; why.push('Available by move-in'); }
    else why.push('Available after move-in');
  } else score += 0.5;

  var needsByu = /yes/i.test(b['BYU-approved?']);
  if (needsByu && !/yes/i.test(s['On BYU contracted list?'])) {
    score -= 1; why.push('Buyer needs BYU-approved, seller is not');
  } else score++;

  var want = (b['Complex / area'] || '').toLowerCase();
  var cx = (s['Complex (lookup name)'] || s['Complex'] || '').toLowerCase();
  if (cx && want.indexOf(cx) >= 0) { score++; why.push('Complex they asked for'); }

  return { score: Math.min(5, Math.round(score * 2) / 2), why: why };
}

function gender_(t) {
  t = t.toLowerCase();
  if (t.indexOf('women') >= 0) return 'Women';
  if (t.indexOf('men') >= 0) return 'Men';
  return '';
}
function room_(t) {
  t = t.toLowerCase();
  var p = t.indexOf('private') >= 0, s = t.indexOf('shared') >= 0;
  if (p && s) return 'either';
  return p ? 'private' : s ? 'shared' : '';
}
function firstNum_(t) { var m = t.replace(/,/g, '').match(/\d{3,4}/); return m ? +m[0] : 0; }
function maxNum_(t) {
  var m = t.replace(/,/g, '').match(/\d{3,4}/g);
  return m ? Math.max.apply(null, m.map(Number)) : 0;
}
// Month index counting from Nov 2026 = 0, so "now" and Dec/Jan compare correctly.
function month_(t) {
  t = t.toLowerCase();
  if (/now|asap|immediately|anytime/.test(t)) return 0.5;
  if (/nov/.test(t)) return 1;
  if (/dec|finals|end of semester/.test(t)) return 2;
  if (/jan|winter/.test(t)) return 3;
  if (/feb/.test(t)) return 4;
  return 0;
}
