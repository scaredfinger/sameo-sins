'use client';

import _ from 'lodash';

import { Result } from '@swan-io/boxed';

import {
  CardsByCategoriesWithProgressiveLoading,
  AsyncResult,
  WithCardinality,
  MonadicMap,
} from '@scaredfinger/cards-by-cats-vm';

import React, {  } from 'react';

interface BaseCategory {
  id: string;
  name: string;
}

interface Props<Card, Category> {
  styles: {
    [key: string]: string;
  }
  viewModel: CardsByCategoriesWithProgressiveLoading<Card, Category>;
  renderCard?: (card: Card, index: number) => JSX.Element;
}

export const CardList = <Card, Category extends BaseCategory>({
  styles,
  viewModel,
  renderCard
}: Props<Card, Category>) => {
  const sanitizedRenderCard = renderCard || renderDefaultCard;
  type CategoryWithCardinality = WithCardinality<Category>;

  function renderCategoriesOrError(
    value: Result<CategoryWithCardinality[], Error>,
    cards: CardsByCategoriesWithProgressiveLoading<Card, Category>
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
    cards: CardsByCategoriesWithProgressiveLoading<Card, Category>
  ) {
    return (
      <>
        <button onClick={() => cards.loadMoreCategories()}>
          Load more categories
        </button>
        <ol id="categories-list">
          {categories.map(([category, cardinality]) => (
            <li className="category-cards" key={category.id}>
              <article>
                <h2>
                  {category.name} ({cardinality})
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
    cardsByCategory: Result<MonadicMap<Category, AsyncResult<Card>[]>, Error>,
    category: Category,
    cards: CardsByCategoriesWithProgressiveLoading<Card, Category>
  ): JSX.Element {
    return (
      <ol>
        {cardsByCategory.match({
          Ok: (cardsByCategory) => {
            const maybeCardsInCategory = cardsByCategory.get(category);
            return maybeCardsInCategory.match({
              Some: (cardsInCategory) => (
                <>
                  <button onClick={() => cards.loadMoreCategories()}>
                    Load more categories
                  </button>
                  <button onClick={() => cards.loadMoreCards(category)}>
                    Load more cards
                  </button>
                  <div style={{ flex: 1, display: 'flex', overflow: 'auto' }}>
                    {renderCards(cardsInCategory)}
                  </div>
                </>
              ),
              None: () => <>No cards in this category</>
            })
          },
          Error: (error) => <li>Error: {error.message}</li>,
        })}
      </ol>
    );
  }

  function renderCards(
    cards: AsyncResult<Card>[]
  ): JSX.Element | JSX.Element[] {
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
                    Ok: (card) => (
                      <div key={i}>
                        { sanitizedRenderCard(card, i) }
                      </div>),
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

  function NotAsked() {
    return <div className={`${styles.card} ${styles.notAsked}`}></div>;
  }
  
  function Loading() {
    return <div className={`${styles.card} ${styles.loading}`}></div>;
  }
  
  function Error({ error }: { error: Error }) {
    return <div>Error: {error.message}</div>;
  }
  
  function renderDefaultCard<Card>(card: Card) {
    return <div className={`${styles.card} ${styles.done}`}></div>;
  }

  return (
    <div className={styles.root}>
      {viewModel.categories.match({
        NotAsked: () => <NotAsked />,
        Loading: () => <Loading />,
        Done: (categories) => renderCategoriesOrError(categories, viewModel),
      })}
    </div>
  );
};
