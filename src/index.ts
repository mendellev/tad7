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

type AssociationRule = {
  S: number;
  C: number;
};

type ItemsAssociationRule = {
  A: ItemsCombo;
  B: Item;
} & AssociationRule;

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
  XLSX.utils.book_append_sheet(workbook, itemsSetsSheet, "Предметні набори F2");

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
  XLSX.utils.book_append_sheet(workbook, tripleSheet, "Предметні набори F3");

  const f3Combos: ItemsComboConsumersCount[] = tripleCombosConsumers.filter(
    (c) => c.consumers >= MINIMUM_CONSUMERS
  );

  const f3Sheet = combosToSheet(f3Combos);
  XLSX.utils.book_append_sheet(workbook, f3Sheet, "F3");

  // ------------------------  F3 END

  // ------------------------  ASSOCIATION two items START

  const toPercent = (percent: number): string => {
    return Math.round(percent * 100).toFixed(2);
  };

  const comboIntoRules = (
    itemCombo: ItemsComboConsumersCount
  ): ItemsAssociationRule[] => {
    const L = itemCombo.items.length;
    const indexSets: number[] = [];

    const calcS = (itemCombo: ItemsComboConsumersCount): number => {
      return itemCombo.consumers / data.length;
    };

    const calcC = (
      itemCombo: ItemsComboConsumersCount,
      itemComboA: ItemsCombo
    ) => {
      return itemCombo.consumers / consumersForCombo(itemComboA);
    };

    const rules: ItemsAssociationRule[] = [];

    for (let i = 0; i < L; i++) {
      const B: Item = itemCombo.items[i];
      const A: ItemsCombo = {
        items: itemCombo.items.filter((_, idx) => idx != i),
      };

      rules.push({
        A,
        B,
        S: calcS(itemCombo),
        C: calcC(itemCombo, A),
      });
    }

    return rules;
  };

  const tripleRules: ItemsAssociationRule[] = f3Combos.flatMap((f3Combo) =>
    comboIntoRules(f3Combo)
  );

  const rulesToSheet = (rules: ItemsAssociationRule[]): XLSX.WorkSheet => {
    return XLSX.utils.aoa_to_sheet([
      ["Якщо умова, то наслідок", "Підтримка", "Достовірність"],
      ...rules.map((rule) => [
        `Якщо ${itemComboToNameString(rule.A)}, то {${rule.B.name}}`,
        toPercent(rule.S),
        toPercent(rule.C),
      ]),
    ]);
  };

  const tripleRulesSheet = rulesToSheet(tripleRules);

  XLSX.utils.book_append_sheet(
    workbook,
    tripleRulesSheet,
    "Асоціативні правила 2 items"
  );

  // ------------------------  ASSOCIATION two items END
  // ------------------------  ASSOCIATION item START
  const doubleRules: ItemsAssociationRule[] = f2Combos.flatMap((f2Combo) =>
    comboIntoRules(f2Combo)
  );

  const doubleRulesSheet = rulesToSheet(doubleRules);

  XLSX.utils.book_append_sheet(
    workbook,
    doubleRulesSheet,
    "Асоціативні правила 1 items"
  );

  // ------------------------  ASSOCIATION item END

  XLSX.writeFileXLSX(workbook, FILENAME, {
    bookType: "xlsx",
    type: "binary",
  });
}

main();
