'use client';

import { AsyncData, Future, Result } from '@swan-io/boxed';

import {
  AsyncFunc,
  AsyncResult,
  CardsByCategoriesWithProgressiveLoading,
  MonadicMap,
  WithCardinality,
} from '@scaredfinger/cards-by-cats-vm';

import { useMemo, useState } from 'react';

interface Options<Card, Category> {
  loadCategories: AsyncFunc<WithCardinality<Category>[]>;
  loadCardsByCategory: (
    categories: Category[],
    offset: number,
    limit: number
  ) => Future<Result<MonadicMap<Category, AsyncResult<Card>[]>, Error>>
  numberOfCategoriesToPreload?: number;
  numberOfCardsToPreload?: number;
  numberOfLoadMoreCards?: number;
  numberOfLoadMoreCategories?: number;
}

export function useCardsByCategoriesState<
  Card,
  Category
>({
  loadCategories,
  loadCardsByCategory,
  numberOfCategoriesToPreload = 2,
  numberOfCardsToPreload = 4,
  numberOfLoadMoreCards = 2,
  numberOfLoadMoreCategories = 1,
}: Options<Card, Category>): CardsByCategoriesWithProgressiveLoading<Card, Category> {
  type CategoryWithCardinality = WithCardinality<Category>;

  const [categories, setCategories] = useState<
    AsyncResult<CategoryWithCardinality[]>
  >(AsyncData.NotAsked());
  const [cardsByCategory, setCardsByCategory] = useState<
    AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>
  >(AsyncData.NotAsked());

  const state = useMemo(
    () => ({
      get categories() {
        return categories;
      },

      submitCategoryChanges: setCategories,

      get cardsByCategory() {
        return cardsByCategory;
      },
      submitCardsByCategoryChanges: setCardsByCategory,
    }),
    [categories, cardsByCategory]
  );

  const viewModel = useMemo(
    () =>
      new CardsByCategoriesWithProgressiveLoading<Card, Category>(
        state,
        loadCategories,
        loadCardsByCategory,
        {
          numberOfCategoriesToPreload,
          numberOfCardsToPreload,
          numberOfLoadMoreCards,
          numberOfLoadMoreCategories,
        }
      ),
    [state]
  );

  return viewModel;
}
