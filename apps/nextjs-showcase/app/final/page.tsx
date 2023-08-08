'use client';

import { useEffect } from 'react';

import { useCardsByCategoriesState } from '../../components/use-cards-by-categories-state';
import { CardList } from 'apps/nextjs-showcase/components/card-list';

import styles from './page.module.scss';
import { Trip, TripCollection, loadCardsByCategory, loadCategories } from './api';

export default function Index() {
  const viewState = useCardsByCategoriesState<Trip, TripCollection>({
    loadCategories,
    loadCardsByCategory,
    numberOfCategoriesToPreload: 2,
    numberOfCardsToPreload: 4,
    numberOfLoadMoreCards: 2,
    numberOfLoadMoreCategories: 1,
  });

  useEffect(() => {
    viewState.preload();
  }, []);

  return <CardList 
    viewModel={viewState} 
    styles={styles} 
    renderCard={renderCards}
  />;
}

function renderCards(card: Trip) {
  return <div className={`${styles.card} ${styles.done}`}>
    <h2>{card.headline}</h2>
    <p>{card.salesPitch}</p>
    <div className={styles.cardImageList}>
      {card.images.map((image, i) => (
        <img key={i} src={image} className={styles.cardImage} />
      ))}
    </div>
  </div>
}
