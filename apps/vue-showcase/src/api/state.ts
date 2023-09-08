import { AsyncFunc, AsyncResult, CardsByCategoriesWithProgressiveLoading, MonadicMap, State, SubmitChangesFunc, WithCardinality } from "@scaredfinger/cards-by-cats-vm";
import { AsyncData, Future, Result } from "@swan-io/boxed";

import { Ref, ref } from "vue";
import { Trip, TripCollection, loadCardsByCategory, loadCategories } from "./trips-and-collections";

export class VueState<Card, Category> implements State<Card, Category> {
  constructor(
    private _categories: Ref<AsyncData<Result<WithCardinality<Category>[], Error>>>,
    private _cardsByCategory: Ref<AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>>,
  ) {

  }

  get categories(): AsyncData<Result<WithCardinality<Category>[], Error>> {
    return this._categories.value;
  }
  submitCategoryChanges(applyChanges: SubmitChangesFunc<AsyncData<Result<WithCardinality<Category>[], Error>>>): void {
    this._categories.value = applyChanges(this._categories.value);
  }
  get cardsByCategory(): AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>> {
    return this._cardsByCategory.value;
  }
  submitCardsByCategoryChanges(applyChanges: SubmitChangesFunc<AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>>): void {
    this._cardsByCategory.value = applyChanges(this._cardsByCategory.value);
  }

}

interface Options<Card, Category> {
  loadCategories: AsyncFunc<WithCardinality<Category>[]>;
  loadCardsByCategory: (
    categories: Category[],
    offset: number,
    limit: number
  ) => Future<Result<MonadicMap<Category, AsyncResult<Card>[]>, Error>>;
  numberOfCategoriesToPreload?: number;
  numberOfCardsToPreload?: number;
  numberOfLoadMoreCategories?: number;
  numberOfLoadMoreCards?: number;
}

export function useState<Card, Category>(
  {
    loadCategories,
    loadCardsByCategory,
    numberOfCategoriesToPreload = 3,
    numberOfCardsToPreload = 5,
    numberOfLoadMoreCategories = 1,
    numberOfLoadMoreCards = 5,
  }: Options<Card, Category>
) {

  const categories: Ref<AsyncData<Result<WithCardinality<Category>[], Error>>> = ref(AsyncData.NotAsked());
  const cardsByCategory: Ref<AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>> = ref(AsyncData.NotAsked());
  const state = new VueState<Card, Category>(categories, cardsByCategory);

  const viewModel = new CardsByCategoriesWithProgressiveLoading<Card, Category>(
    state,
    loadCategories,
    loadCardsByCategory,
    {
      numberOfCategoriesToPreload,
      numberOfCardsToPreload,
      numberOfLoadMoreCards,
      numberOfLoadMoreCategories,
    }
  )

  return viewModel
}

export function useTripsAndTripsCollectionsViewModel() {
  return useState<Trip, TripCollection>({
    loadCategories,
    loadCardsByCategory,
  })
}