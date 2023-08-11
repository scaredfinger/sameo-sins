'use client'

import { useEffect } from 'react'

import {
  loadCategories,
  loadCardsByCategory,
  Trip,
  TripCollection,
} from '../api/trips-and-collections'
import { useCardsByCategoriesState } from '../../components/use-cards-by-categories-state'
import { CardList } from '../../components/card-list'

import { PortableText } from '@portabletext/react'

import styles from './page.module.scss'
import Link from 'next/link'

export default function Index() {
  const viewState = useCardsByCategoriesState<Trip, TripCollection>({
    loadCategories,
    loadCardsByCategory,
    numberOfCategoriesToPreload: 2,
    numberOfCardsToPreload: 4,
    numberOfLoadMoreCards: 2,
    numberOfLoadMoreCategories: 1,
  })

  useEffect(() => {
    viewState.preload()
  }, [])

  return (
    <>
      <Link className="back" href="/">
        ← Back
      </Link>
      <CardList
        viewModel={viewState}
        styles={styles}
        renderCard={renderCard}
      />
    </>
  )
}

function renderCard(card: Trip) {
  return (
    <div className={`${styles.card} ${styles.done}`}>
      <h3>{card.headline}</h3>
      <PortableText value={card.salesPitch} />
      <div className={styles.cardImageList}>
        {card.images.map((image, i) => (
          <img key={i} src={image} className={styles.cardImage} />
        ))}
      </div>
    </div>
  )
}
