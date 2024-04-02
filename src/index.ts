import * as XLSX from "xlsx";
import * as fs from "fs";

type Item = {
  alias: string;
  name: string;
};

type ConsumersCount = {
  consumers: number;
};

type ItemConsumersCount = Item & ConsumersCount;

type ItemsCombo = {
  items: Item[];
};
type ItemsComboConsumersCount = ItemsCombo & ConsumersCount;

const MINIMUM_CONSUMERS = 5;
const MINIMUM_C = 0.7;

const FILENAME = "results.xlsx";

async function main() {
  const items: Item[] = [
    {
      alias: "A",
      name: "Растішка",
    },
    {
      alias: "B",
      name: "ДаніСімо",
    },
    {
      alias: "C",
      name: "Живинка",
    },
    {
      alias: "D",
      name: "milupa",
    },
    {
      alias: "E",
      name: "Actimel",
    },
    { alias: "F", name: "Nutrilon" },
    { alias: "G", name: "Активіа" },
    { alias: "H", name: "Простоквашено " },
  ];

  const findIndexForItem = (item: Item): number => {
    return item.alias.charCodeAt(0) - 65; // 65 = 'A'
  };

  const indexToAlias = (idx: number): string => {
    return items[idx].alias;
  };

  const indexToName = (idx: number): string => {
    return items[idx].name;
  };

  const data: number[][] = [
    [0, 0, 1, 1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 0, 0, 0, 1],
    [0, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 0, 0, 1, 0],
    [1, 0, 0, 0, 0, 1, 0, 0],
    [1, 1, 1, 1, 0, 0, 1, 1],
    [0, 1, 0, 0, 1, 0, 0, 1],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 1, 0, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0, 1, 0, 0],
  ];

  const consumersForItemIdx = (idx: number): number => {
    return data.reduce((acc, n) => acc + n[idx], 0);
  };

  const consumersForItem = (item: Item): number => {
    const idx = findIndexForItem(item);
    return consumersForItemIdx(idx);
  };

  const workbook: XLSX.WorkBook = XLSX.utils.book_new();

  // ------------------------  SUM SHEET START
  const itemConsumers: ItemConsumersCount[] = items.map((item, idx) => ({
    ...item,
    consumers: consumersForItemIdx(idx),
  }));

  const itemsWithMinimumConsumers = itemConsumers.filter(
    (item) => item.consumers >= MINIMUM_CONSUMERS
  );

  const sumSheet = XLSX.utils.aoa_to_sheet([
    ["номер транзакції", ...items.map((item) => item.name)],
    ...data.map((d, idx) => [idx + 1, ...d]),
    ["Sum", ...itemsWithMinimumConsumers.map((i) => i.consumers)],
  ]);
  XLSX.utils.book_append_sheet(workbook, sumSheet, "Транзакції");
  // ------------------------  SUM SHEET END

  // ------------------------  Предметні набори END

  const itemComboToString = (itemCombo: ItemsCombo): string => {
    return itemCombo.items
      .map((item) => item.alias)
      .sort()
      .join();
  };

  const itemComboToNameString = (itemCombo: ItemsCombo): string => {
    return `{${itemCombo.items.map((item) => item.name).join(", ")}}`;
  };

  const compareItemsCombo = (
    itemCombo1: ItemsCombo,
    itemCombo2: ItemsCombo
  ): boolean => {
    return itemComboToString(itemCombo1) == itemComboToString(itemCombo2);
  };

  const combos: ItemsCombo[] = [];

  const L = items.length;
  for (let i = 0; i < L; ++i) {
    for (let j = i + 1; j < L; ++j) {
      combos.push({ items: [items[i], items[j]] });
    }
  }

  console.log(JSON.stringify(combos));

  const consumersForCombo = (combo: ItemsCombo): number => {
    return data.reduce(
      (acc, n) =>
        acc +
        combo.items
          .map((item) => n[findIndexForItem(item)])
          .reduce((acc2, n2) => acc2 & n2, 1),
      0
    );
    // return combo.items.map(item=> data.reduce((acc,n)=> n[findIndexForItem(item)], 0) )
  };

  const comboConsumers: ItemsComboConsumersCount[] = combos.map((combo) => ({
    ...combo,
    consumers: consumersForCombo(combo),
  }));

  const combosToSheet = (
    combos: ItemsComboConsumersCount[]
  ): XLSX.WorkSheet => {
    return XLSX.utils.aoa_to_sheet([
      ["Набір", "Кількість"],
      ...combos.map((cc) => [itemComboToNameString(cc), cc.consumers]),
    ]);
  };

  const itemsSetsSheet = combosToSheet(comboConsumers);
  XLSX.utils.book_append_sheet(workbook, itemsSetsSheet, "Предметні набори");

  // ------------------------  Предметні набори END
  // ------------------------  F2 START

  const f2Combos: ItemsComboConsumersCount[] = comboConsumers.filter(
    (combo) => combo.consumers >= MINIMUM_CONSUMERS
  );

  const f2Sheet = combosToSheet(f2Combos);
  XLSX.utils.book_append_sheet(workbook, f2Sheet, "F2");
  // ------------------------  F2 END

  // ------------------------  F3 START
  const canMergeComboItems = (
    item1: ItemsCombo,
    item2: ItemsCombo
  ): boolean => {
    return item1.items.some((it1) =>
      item2.items.some((it2) => it1.alias == it2.alias)
    );
  };

  const mergeComboItems = (
    item1: ItemsCombo,
    item2: ItemsCombo
  ): ItemsCombo => {
    return {
      items: Array.from(
        new Set(
          item1.items
            .map((i) => findIndexForItem(i))
            .concat(item2.items.map((i) => findIndexForItem(i)))
        )
      ).map((index) => items[index]),
    };
  };

  const tripleCombos: ItemsCombo[] = [];

  const comboL = f2Combos.length;
  const tripleSets: Set<string> = new Set();
  for (let i = 0; i < comboL; ++i) {
    for (let j = i + 1; j < comboL; ++j) {
      if (canMergeComboItems(f2Combos[i], f2Combos[j])) {
        const mergedCombo = mergeComboItems(f2Combos[i], f2Combos[j]);
        if (!tripleSets.has(itemComboToString(mergedCombo))) {
          tripleCombos.push(mergedCombo);
          tripleSets.add(itemComboToString(mergedCombo));
        }
      }
    }
  }

  const tripleCombosConsumers: ItemsComboConsumersCount[] = tripleCombos.map(
    (combo) => ({ ...combo, consumers: consumersForCombo(combo) })
  );

  const tripleSheet = combosToSheet(tripleCombosConsumers);
  XLSX.utils.book_append_sheet(workbook, tripleSheet, "F3 combos");

  const f3Combos: ItemsComboConsumersCount[] = tripleCombosConsumers.filter(
    (c) => c.consumers >= MINIMUM_CONSUMERS
  );

  const f3Sheet = combosToSheet(f3Combos);
  XLSX.utils.book_append_sheet(workbook, f3Sheet, "F3 results");

  // ------------------------  F3 END
  XLSX.writeFileXLSX(workbook, FILENAME, {
    bookType: "xlsx",
    type: "binary",
  });
}

main();

/*

const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    const detailsSheet = queryParamsToDetailsSheet(searchRequest, {
      tabName: searchRequest.tabName,
    });
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Details');

    let topKeywords: WordCount[] = [];
    // Object.keys(data).forEach((key) => {
    data.items.forEach((item) => {
      const wordcloud: WordCount[] = item.words;
      wordcloud.sort((a, b) => b.count - a.count);
      topKeywords.push(...wordcloud);
      const cells = [['Word', 'Count']].concat(
        wordcloud.map((cell) => [cell.name, `${cell.count}`]),
      );

      const sheet = XLSX.utils.aoa_to_sheet(cells);
      XLSX.utils.book_append_sheet(workbook, sheet, item.name);
    });

    topKeywords.sort((a, b) => b.count - a.count);
    topKeywords = topKeywords.slice(0, 50);
    const topKeywordsCells = [['Word', 'Count']].concat(
      topKeywords.map((cell) => [cell.name, `${cell.count}`]),
    );
    const topKeywordsSheet = XLSX.utils.aoa_to_sheet(topKeywordsCells);
    XLSX.utils.book_append_sheet(workbook, topKeywordsSheet, 'all');

    XLSX.writeFileXLSX(workbook, fileName, {
      bookType: 'xlsx',
      type: 'binary',
    });

    const xlsxStream = fs.createReadStream(fileName);

    xlsxStream.pipe(response);

    xlsxStream.on('end', () => {
      console.log(`EXLS stream end`);
      fs.rmSync(fileName);
    });
*/
