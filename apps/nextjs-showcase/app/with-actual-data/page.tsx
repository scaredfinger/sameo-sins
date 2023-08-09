'use client';

import { useEffect } from 'react';

import { loadCardsByCategory, loadCategories } from './api';
import { CardList } from '../../components/card-list';
import { useCardsByCategoriesState } from '../../components/use-cards-by-categories-state';

import styles from './page.module.scss';
import Link from "next/link";

interface Card {
  name: string;
}

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

  return <>
    <Link className="back" href="/">← Back</Link>
    <CardList viewModel={viewState} styles={styles} /></>;
}
