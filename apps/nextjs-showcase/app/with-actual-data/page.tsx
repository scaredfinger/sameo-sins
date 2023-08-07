'use client'

import { useEffect, useMemo } from 'react';

import {
  CardsByCategoriesWithProgressiveLoading,
} from '@scaredfinger/cards-by-cats-vm';

import { loadCardsByCategory, loadCategories } from './api';
import { CardList } from '../../components/card-list';
import { useCardsByCategoriesState } from '../../components/use-cards-by-categories-state';

import styles from './page.module.scss';

interface Card {
  name: string
};

export default function Index() {
  const viewState = useCardsByCategoriesState<Card, string>({
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

  return (
    <CardList viewModel={viewState} styles={styles}/>
  );
}
