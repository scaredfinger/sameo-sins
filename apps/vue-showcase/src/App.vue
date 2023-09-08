<script setup lang="ts">
import { useTripsAndTripsCollectionsViewModel } from './api/state'
import { Card } from './components/card'

const styles: any = {}
const viewModel = useTripsAndTripsCollectionsViewModel()
viewModel.preload()
</script>
<template>
  <div v-if="viewModel.categories.isDone()">
    <div v-if="viewModel.categories.value.isError()">Error</div>
    <div v-if="viewModel.categories.value.isOk()">
      <button @click="viewModel.loadMoreCategories()">
        Load more categories
      </button>
      <ol id="categories-list">
        <li
          class="category-cards"
          v-for="[category, cardinality] in viewModel.categories.value.value"
          :key="category.id"
        >
          <article>
            <h2>{{ category.name }} ({{ cardinality }})</h2>
            <button @click="viewModel.loadMoreCategories()">
              Load more categories
            </button>
            <button @click="viewModel.loadMoreCards(category)">
              Load more cards
            </button>

            <div style="{ flex: 1, display: 'flex', overflow: 'auto' }">
              <ol
                v-if="
                  viewModel.cardsByCategory.isDone() &&
                  viewModel.cardsByCategory.value.isOk() &&
                  viewModel.cardsByCategory.value.value.get(category).isSome()
                "
              >
                <li
                  v-for="card in viewModel.cardsByCategory.value.value
                    .get(category)
                    .getWithDefault([])"
                  :key="card.mapOk((trip) => trip.id)"
                >
                  <Card 
                    :card="card"
                    :styles="styles"
                  />
                </li>
              </ol>
            </div>
          </article>

          <div></div>
        </li>
      </ol>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>
