'use client'

import { useEffect } from 'react';
import _ from 'lodash';

import { loadCardsByCategory, loadCategories } from './api';
import { CardList } from '../../components/card-list';
import { useCardsByCategoriesState } from '../../components/use-cards-by-categories-state';

import styles from './page.module.scss';
import Link from "next/link";

interface Card {
  name: string
};

export default function Index() {
  const viewModel = useCardsByCategoriesState<Card, string>({
    loadCategories,
    loadCardsByCategory,
    numberOfCategoriesToPreload: 2,
    numberOfCardsToPreload: 4,
    numberOfLoadMoreCards: 2,
    numberOfLoadMoreCategories: 1,
  });

  useEffect(() => {
    viewModel.preload();
  }, []);

  return (
    <>
      <Link className="back" href="/">← Back</Link>
      <CardList viewModel={viewModel} styles={styles}/></>
  );
}
