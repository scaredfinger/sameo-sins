import { AsyncResult, WithCardinality } from "@scaredfinger/cards-by-cats-vm";
import { AsyncData, Future, Result } from "@swan-io/boxed";
import _ from "lodash";

type CategoryWithCardinality = WithCardinality<string>;

const ALL_CATEGORIES = [
  ['Category 1', 35],
  ['Category 2', 23],
  ['Category 3', 41],
  ['Category 4', 31],
  ['Category 5', 22],
];

export function loadCategories(): Future<Result<CategoryWithCardinality[], Error>> {
  return Future.make((resolve) => {
    const categories = ALL_CATEGORIES;

    setTimeout(
      () =>
        resolve(
          Result.Ok<CategoryWithCardinality[], Error>(
            categories as CategoryWithCardinality[]
          )
        ),
      2000
    );
  });
}

export function loadCardsByCategory(
  categories: string[],
  offset: number,
  limit: number
) {
  return Future.make<Result<Map<string, AsyncResult<Card>[]>, Error>>(
    (resolve) => {
      const cards: Array<[string, AsyncResult<Card>[]]> = categories.map(
        (category) => {
          const categorySize = _.find(ALL_CATEGORIES, (c) => c[0] === category)![1] as number;
          if (offset > categorySize) {
            return [category, []];
          }

          if (offset + limit > categorySize) {
            limit = categorySize - offset;
          }

          if (limit <= 0) {
            return [category, []];
          }

          return [
            category,
            Array(limit)
              .fill(limit)
              .map((_, i) =>
                AsyncData.Done(
                  Result.Ok<Card, Error>({
                    title: `${category} - Card ${i + 1 + offset}`,
                  })
                )
              ),
          ];
        }
      );

      setTimeout(
        () =>
          resolve(
            Result.Ok<Map<string, AsyncResult<Card>[]>, Error>(new Map(cards))
          ),
          Math.random() * (2000 - 500) + 500
      );
    }
  );
}

interface Card {
  title: string;
}