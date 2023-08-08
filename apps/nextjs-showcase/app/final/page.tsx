'use client';

import { useEffect } from 'react';

import { loadCategories, loadCardsByCategory, Trip } from '../with-actual-data/api'
import { useCardsByCategoriesState } from '../../components/use-cards-by-categories-state';
import { CardList } from 'apps/nextjs-showcase/components/card-list';

import styles from './page.module.scss';
import Link from "next/link";

export default function Index() {
  const viewState = useCardsByCategoriesState<Trip, string>({
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

  return <>
    <Link className="back" href="/">← Back</Link>
    <CardList
    viewModel={viewState} 
    styles={styles} 
    renderCard={renderCards}
  />
  </>;
}

function renderCards(card: Trip) {
  return <div className={`${styles.card} ${styles.done}`}>
    <h3>{card.headline}</h3>
    <p>{card.salesPitch}</p>
    <div className={styles.cardImageList}>
          {card.images.map((image, i) => (
            <img key={i} src={image} className={styles.cardImage} />
          ))}
    </div>
  </div>
}
