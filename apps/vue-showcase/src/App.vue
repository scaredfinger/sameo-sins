<style lang="scss">
  @import "./styles.scss";
</style>
<script setup lang="ts">
import { useTripsAndTripsCollectionsViewModel } from './api/state'
import { TripCollection } from './api/trips-and-collections'
import { Card } from './components/card'

const styles: any = {
  card: 'card',
  cardfInCat: 'cardsInCat',
  done: 'done',
  error: 'error',
  notAsked: 'notAsked',
  loading: 'loading',
  cardImageList: 'cardImageList',
  cardImage: 'cardImage',
}
const viewModel = useTripsAndTripsCollectionsViewModel()
viewModel.preload()

function areCategoriesDoneDownloading() {
  return viewModel.categories.isDone()
}

function areCategoriesOk() {
  return viewModel.categories.match({
    Done: (categories) => categories.isOk(),
    NotAsked: () => false,
    Loading: () => false,
  })
}

function getCategories() {
  return viewModel.categories.match({
    Done: (categories) => categories.match({
      Ok: (okCategories) => okCategories,
      Error: () => [],
    }),
    NotAsked: () => [],
    Loading: () => [],
  })
}

function areCardsReady() {
  return viewModel.categories.isDone() && viewModel.cardsByCategory.isDone()
}

function getCategoryCards(tripCollection: TripCollection) {
  return viewModel.cardsByCategory.match({
    Done: (cardsByCategory) => cardsByCategory.match({
      Ok: (okCardsByCategory) => okCardsByCategory.get(tripCollection).match({
        Some: (cards) => cards,
        None: () => [],
      }),
      Error: () => [],
    }),
    NotAsked: () => [],
    Loading: () => [],
  })
}
</script>
<template>
  <div v-if="areCategoriesDoneDownloading()">
    <div v-if="areCategoriesOk()">
      <button @click="() => viewModel.loadMoreCategories()">
        Load more categories
      </button>
      <ol id="categories-list">
        <li
          class="category-cards"
          v-for="[category, cardinality] in getCategories()"
          :key="category.id"
        >
          <article>
            <h2>{{ category.name }} ({{ cardinality }})</h2>
            <button @click="() => viewModel.loadMoreCategories()">
              Load more categories
            </button>
            <button @click="() => viewModel.loadMoreCards(category)">
              Load more cards
            </button>

            <ol
              class="cardsInCat"
              style="display: flex; overflow: auto;"
              v-if="areCardsReady()">
              <li
                v-for="card in getCategoryCards(category)"
                :key="card.mapOk((trip) => trip.id)"
              >
                <Card 
                  :card="card"
                  :styles="styles"
                />
              </li>
            </ol>
          </article>

          <div></div>
        </li>
      </ol>
    </div>
    <div v-else>Error</div>
  </div>
  <div v-else>Loading...</div>
</template>
