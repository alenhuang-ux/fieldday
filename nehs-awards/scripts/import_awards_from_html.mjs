import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const [, , inputPath = "/private/tmp/award2.html", outputPath = "award-site/awards-data.js"] =
  process.argv;

const html = readFileSync(inputPath, "utf8");

const rankNumbers = {
  第一名: 1,
  第二名: 2,
  第三名: 3,
  第四名: 4,
  第五名: 5,
  第六名: 6,
};

const highGradeNumbers = {
  一: 10,
  二: 11,
  三: 12,
};

const middleGradeNumbers = {
  一: 7,
  二: 8,
  三: 9,
};

const bilingualGradeNumbers = {
  七年: 7,
  八年: 8,
  九年: 9,
  十年: 10,
  十一年: 11,
  十二年: 12,
};

function cleanCell(value) {
  return value
    .replace(/<\/?pre>/gi, "")
    .replace(/<BR>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitEvent(rawEvent) {
  const match = rawEvent.match(/^(.*?)\s+(Gr\.\s.*)$/);
  return {
    eventName: (match?.[1] ?? rawEvent).trim(),
    eventEn: (match?.[2] ?? "").trim(),
  };
}

function classifyType(eventName) {
  if (eventName.includes("400公尺接力")) return "400公尺接力";
  if (eventName.includes("1200公尺接力")) return "1200公尺接力";
  if (eventName.includes("100公尺") && !eventName.includes("接力")) return "100公尺";
  if (eventName.includes("200公尺")) return "200公尺";
  if (eventName.includes("400公尺") && !eventName.includes("接力")) return "400公尺";
  if (eventName.includes("800公尺")) return "800公尺";
  if (eventName.includes("1500公尺")) return "1500公尺";
  if (eventName.includes("跳遠")) return "跳遠";
  if (eventName.includes("鉛球")) return "鉛球";
  if (eventName.includes("跳高")) return "跳高";
  return "全部";
}

function parseRank(rawRank) {
  const match = rawRank.match(/^(第[一二三四五六七八九十]+名)\s+(.+)$/);
  const rankText = match?.[1] ?? rawRank;
  return {
    rank: rankNumbers[rankText] ?? 0,
    rankText,
    rankEn: match?.[2] ?? "",
  };
}

function parseGradeClass(rawGradeClass) {
  const [schoolUnit, gradeClass = ""] = rawGradeClass.split(/\s+/, 2);

  if (schoolUnit === "高中部") {
    const match = gradeClass.match(/^([一二三])年(.+)$/);
    return {
      department: "中學部",
      schoolUnit,
      gradeNumber: highGradeNumbers[match?.[1]] ?? 0,
      gradeLabel: match ? `高${match[1]}` : gradeClass,
      className: match?.[2] ?? "",
    };
  }

  if (schoolUnit === "國中部") {
    const match = gradeClass.match(/^([一二三])年(.+)$/);
    return {
      department: "中學部",
      schoolUnit,
      gradeNumber: middleGradeNumbers[match?.[1]] ?? 0,
      gradeLabel: match ? `國${match[1]}` : gradeClass,
      className: match?.[2] ?? "",
    };
  }

  if (schoolUnit === "雙語部") {
    const match = gradeClass.match(/^(七年|八年|九年|十年|十一年|十二年)(.+)$/);
    return {
      department: "雙語部",
      schoolUnit,
      gradeNumber: bilingualGradeNumbers[match?.[1]] ?? 0,
      gradeLabel: match?.[1] ?? gradeClass,
      className: match?.[2] ?? "",
    };
  }

  return {
    department: schoolUnit === "雙語部" ? "雙語部" : "中學部",
    schoolUnit,
    gradeNumber: 0,
    gradeLabel: gradeClass,
    className: "",
  };
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{Script=Han}A-Za-z0-9]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const rows = html
  .split(/\r?\n/)
  .filter((line) => /^<TR><TD>/i.test(line) && !line.includes("<TD>Event<TD>"));

const records = rows.map((line, index) => {
  const cells = line.replace(/^<TR><TD>/i, "").split(/<TD>/i).map(cleanCell);
  const [rawEvent, rawRank, rawGradeClass, name1, name2, name3, name4, score, note, enteredAt] =
    cells;
  const { eventName, eventEn } = splitEvent(rawEvent);
  const rank = parseRank(rawRank);
  const grade = parseGradeClass(rawGradeClass);
  const people = [name1, name2, name3, name4].filter(Boolean);
  const id = `${slugify(eventName)}-${rank.rank || "rank"}-${slugify(rawGradeClass)}-${index + 1}`;

  return {
    id,
    ...grade,
    rawName: people.join(" / "),
    ...(people.length > 1 ? { members: people } : {}),
    type: classifyType(eventName),
    eventName,
    eventEn,
    group: eventName.match(/(男子組|女子組|混合組)/)?.[1] ?? "",
    ...rank,
    score,
    ...(note ? { note } : {}),
    ...(enteredAt ? { enteredAt } : {}),
  };
});

const output = `// Generated from ${basename(inputPath)}. Do not edit by hand.\nwindow.AWARD_RECORDS = ${JSON.stringify(
  records,
  null,
  2,
)};\n`;

writeFileSync(outputPath, output, "utf8");

console.log(`Imported ${records.length} award records to ${outputPath}`);
