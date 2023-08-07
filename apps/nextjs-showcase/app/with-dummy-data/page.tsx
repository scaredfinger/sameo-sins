'use client'

import _ from 'lodash';

import { AsyncData, Future, Result } from '@swan-io/boxed';

import {
  CardsByCategoriesWithProgressiveLoading,
  AsyncResult,
  State,
  WithCardinality,
} from '@scaredfinger/cards-by-cats-vm';

import { useEffect, useMemo, useState } from 'react';

import styles from './page.module.scss';
import { loadCardsByCategory, loadCategories } from './api';

type CategoryWithCardinality = WithCardinality<string>;

interface Card {
  name: string
};

function useCardsByCategoriesState(): State<Card, string> {
  const [categories, setCategories] = useState<
    AsyncResult<CategoryWithCardinality[]>
  >(AsyncData.NotAsked());
  const [cardsByCategory, setCardsByCategory] = useState<
    AsyncResult<Map<string, AsyncResult<Card>[]>>
  >(AsyncData.NotAsked());

  return useMemo(
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
}

export default function Index() {
  const state = useCardsByCategoriesState();

  const cards = useMemo(
    () =>
      new CardsByCategoriesWithProgressiveLoading<Card>(
        state,
        loadCategories,
        loadCardsByCategory,
        {
          numberOfCategoriesToPreload: 2,
          numberOfCardsToPreload: 4,
          numberOfLoadMoreCards: 2,
          numberOfLoadMoreCategories: 1,
        }
      ),
    [state]
  );

  useEffect(() => {
    cards.preload();
  }, []);

  return (
    <div className={styles.root}>
      {cards.categories.match({
        NotAsked: () => <NotAsked />,
        Loading: () => <Loading />,
        Done: (categories) => renderCategoriesOrError(categories, cards),
      })}
    </div>
  );
}

function NotAsked() {
  return <div className={`${styles.card} ${styles.notAsked}`}></div>;
}

function Loading() {
  return <div className={`${styles.card} ${styles.loading}`}></div>;
}

function Error({ error }: { error: Error }) {
  return <div>Error: {error.message}</div>;
}

function renderCategoriesOrError(
  value: Result<CategoryWithCardinality[], Error>,
  cards: CardsByCategoriesWithProgressiveLoading<Card>
) {
  return (
    <>
      {value.match({
        Ok: (categories) => renderCategories(categories, cards),
        Error: (error) => <Error error={error} />,
      })}
    </>
  );
}

function renderCategories(
  categories: CategoryWithCardinality[],
  cards: CardsByCategoriesWithProgressiveLoading<Card>
) {
  return (
    <>
      <button onClick={() => cards.loadMoreCategories()}>
        Load more categories
      </button>
      <ol id="categories-list">
        {categories.map(([category, cardinality]) => (
          <li className="category-cards" key={category}>
            <article>
              <h2>
                {category} ({cardinality})
              </h2>
              <>
                {cards.cardsByCategory.match({
                  NotAsked: () => <NotAsked />,
                  Loading: () => <Loading />,
                  Done: (cardsByCategory) =>
                    renderCardsByCategory(cardsByCategory, category, cards),
                })}
              </>
            </article>
          </li>
        ))}
      </ol>
    </>
  );
}

function renderCardsByCategory(
  cardsByCategory: Result<Map<string, AsyncResult<Card>[]>, Error>,
  category: string,
  cards: CardsByCategoriesWithProgressiveLoading<Card>
): JSX.Element {
  return (
    <ol>
      {cardsByCategory.match({
        Ok: (cardsByCategory) => {
          const cardsInCategory = cardsByCategory.get(category);
          if (cardsInCategory) {
            return (
              <>
                <button onClick={() => cards.loadMoreCategories()}>
                  Load more categories
                </button>
                <button onClick={() => cards.loadMoreCards(category)}>
                  Load more cards
                </button>
                {renderCards(cardsInCategory)}
              </>
            );
          } else {
            return <>No cards in this category</>;
          }
        },
        Error: (error) => <li>Error: {error.message}</li>,
      })}
    </ol>
  );
}

function renderCards(cards: AsyncResult<Card>[]): JSX.Element | JSX.Element[] {
  return (
    <ol className={styles.cardsInCat}>
      {cards.map((card, i) => (
        <li key={i}>
          {card.match({
            NotAsked: () => <NotAsked />,
            Loading: () => <Loading />,
            Done: (cardOrError) => (
              <>
                {cardOrError.match({
                  Ok: (card) => renderCard(card),
                  Error: (error) => (
                    <div className={`${styles.card} ${styles.error}`}>
                      {error.message}
                    </div>
                  ),
                })}
              </>
            ),
          })}
        </li>
      ))}
    </ol>
  );
}

function renderCard(card: Card) {
  return (
    <div className={`${styles.card} ${styles.done}`}>
      <h2>{card.name}</h2>
    </div>
  );
}
