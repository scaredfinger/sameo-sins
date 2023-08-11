import { AsyncData, Future, Result, Option } from '@swan-io/boxed'

export type AsyncFunc<T = unknown> = () => Future<Result<T, Error>>

export type WithCardinality<Category> = [Category, number]

export type SubmitChangesFunc<T> = (value: T) => T

export interface CategoryWithCards<Category, Card> {
  category: Category
  cards: Card[]
}

export type AsyncResult<T> = AsyncData<Result<T, Error>>

export function ok<T>(value: T): AsyncResult<T> {
  return AsyncData.Done(Result.Ok(value))
}

export function fail<T>(error: Error): AsyncResult<T> {
  return AsyncData.Done(Result.Error(error))
}

export interface State<Card = never, Category = never> {
  readonly categories: AsyncData<Result<WithCardinality<Category>[], Error>>
  submitCategoryChanges(
    applyChanges: SubmitChangesFunc<
      AsyncData<Result<WithCardinality<Category>[], Error>>
    >
  ): void

  readonly cardsByCategory: AsyncResult<
    MonadicMap<Category, AsyncResult<Card>[]>
  >
  submitCardsByCategoryChanges(
    applyChanges: SubmitChangesFunc<
      AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>
    >
  ): void
}

interface CardsByCategoriesWithProgressiveLoadingOptions {
  numberOfCategoriesToPreload?: number
  numberOfCardsToPreload?: number
  numberOfLoadMoreCategories?: number
  numberOfLoadMoreCards?: number
}

export class CardsByCategoriesWithProgressiveLoading<
  Card = never,
  Category = string
> {
  private numberOfCategoriesToPreload: number
  private numberOfCardsToPreload: number
  private numberOfLoadMoreCategories: number
  private numberOfLoadMoreCards: number

  public get categories(): AsyncData<
    Result<WithCardinality<Category>[], Error>
  > {
    return this.state.categories
  }

  public get cardsByCategory(): AsyncResult<
    MonadicMap<Category, AsyncResult<Card>[]>
  > {
    return this.state.cardsByCategory
  }

  constructor(
    private state: State<Card, Category>,
    private loadCategories: AsyncFunc<WithCardinality<Category>[]>,
    private loadCardsByCategory: (
      categories: Category[],
      offset: number,
      limit: number
    ) => Future<Result<MonadicMap<Category, AsyncResult<Card>[]>, Error>>,
    {
      numberOfCategoriesToPreload = 3,
      numberOfCardsToPreload = 5,
      numberOfLoadMoreCategories = 1,
      numberOfLoadMoreCards = 2,
    }: CardsByCategoriesWithProgressiveLoadingOptions = {}
  ) {
    this.numberOfCategoriesToPreload = numberOfCategoriesToPreload
    this.numberOfCardsToPreload = numberOfCardsToPreload
    this.numberOfLoadMoreCategories = numberOfLoadMoreCategories
    this.numberOfLoadMoreCards = numberOfLoadMoreCards
  }

  public preload() {
    this.state.submitCategoryChanges(() => AsyncData.Loading())
    this.state.submitCardsByCategoryChanges(() => AsyncData.Loading())

    this.loadCategories()
      .mapOk((categories) => {
        this.state.submitCategoryChanges(() => ok(categories))

        const cardsByCategory = new MonadicMap<Category, AsyncResult<Card>[]>()
        categories.forEach(([category, cardinality]) => {
          cardsByCategory.set(
            category,
            Array(cardinality).fill(AsyncData.NotAsked())
          )
        })
        this.state.submitCardsByCategoryChanges(() => ok(cardsByCategory))

        this.loadCardsForCategoryRange({
          from: 0,
          to: this.numberOfCategoriesToPreload,
          categories,
          cardsByCategory,
        })
      })
      .mapError((error) => {
        this.state.submitCategoryChanges(() => fail(error))
        this.state.submitCardsByCategoryChanges(() => fail(error))
      })
  }

  private loadCardsForCategoryRange({
    from,
    to,
    categories,
    cardsByCategory,
  }: {
    from: number
    to: number
    categories: WithCardinality<Category>[]
    cardsByCategory: MonadicMap<Category, AsyncResult<Card>[]>
  }) {
    const categoriesToLoad = categories.slice(from, to)

    this.loadCardsForSpecifiedCategories({ categoriesToLoad, cardsByCategory })
  }

  private loadCardsForSpecifiedCategories({
    categoriesToLoad,
    offset = 0,
    limit = this.numberOfCardsToPreload,
    cardsByCategory,
  }: {
    categoriesToLoad: WithCardinality<Category>[]
    offset?: number
    limit?: number
    cardsByCategory: MonadicMap<Category, AsyncResult<Card>[]>
  }) {
    const loadingCardsLength = limit

    this.state.submitCardsByCategoryChanges((current) =>
      mergeValuesForLoading(
        current,
        categoriesToLoad,
        offset,
        loadingCardsLength
      )
    )

    this.loadCardsByCategory(
      categoriesToLoad.map(([category]) => category),
      offset,
      limit
    ).mapOk((loadedCardsByCategory) => {
      const from = offset
      const to = from + limit

      this.state.submitCardsByCategoryChanges((current) => {
        return mergeValuesWhenLoadDone(current, loadedCardsByCategory, from, to)
      })
    })
  }

  public loadMoreCategories() {
    this.categories.mapOk((categories) => {
      this.cardsByCategory.mapOk((cardsByCategory) => {
        const countOfCategoriesWithAskedOrLoadedCards = Array.from(
          cardsByCategory.values()
        ).filter((cards) => cards.some((card) => !card.isNotAsked())).length

        const from = countOfCategoriesWithAskedOrLoadedCards
        const to = from + this.numberOfLoadMoreCategories

        if (to > categories.length) {
          return
        }

        this.loadCardsForCategoryRange({
          from,
          to,
          categories,
          cardsByCategory,
        })
      })
    })
  }

  public loadMoreCards(category: Category) {
    this.categories.mapOk((categories) => {
      this.cardsByCategory.mapOk((cardsByCategory) => {
        const cards = cardsByCategory.get(category)

        cards.map((cards) => {
          const offset = cards.findIndex((c) => c.isNotAsked())

          if (offset === -1) {
            return
          }

          let limit = this.numberOfLoadMoreCards

          if (offset + limit >= cards.length) {
            limit = cards.length - offset
          }

          this.loadCardsForSpecifiedCategories({
            categoriesToLoad: categories.filter(([name]) => name === category),
            offset,
            limit,
            cardsByCategory,
          })
        })
      })
    })
  }
}

function mergeValuesForLoading<Category, Card>(
  current: AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>,
  categoriesToLoad: WithCardinality<Category>[],
  offset: number,
  loadingCardsLength: number
): AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>> {
  return current.mapOk((cardsByCategories) => {
    const cardsByCategoriesWithLoading = new MonadicMap<
      Category,
      AsyncResult<Card>[]
    >(cardsByCategories)

    categoriesToLoad.forEach(([category, cardinality]) => {
      const categoryCards = cardsByCategoriesWithLoading.get(category)

      categoryCards.map((categoryCards) => {
        const cardsBefore = categoryCards.slice(0, offset)
        const sanitizedLoadingCardsLength = Math.min(cardinality, loadingCardsLength)
        const loadingCards = Array(sanitizedLoadingCardsLength).fill(AsyncData.Loading())
        const numberOfNonAskedCards = cardinality - sanitizedLoadingCardsLength - offset
        const nonAskedCards = Array(numberOfNonAskedCards).fill(
          AsyncData.NotAsked()
        )

        cardsByCategoriesWithLoading.set(category, [
          ...cardsBefore,
          ...loadingCards,
          ...nonAskedCards,
        ])
      })
    })

    return cardsByCategoriesWithLoading
  })
}

function mergeValuesWhenLoadDone<Category, Card>(
  current: AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>,
  loadedCardsByCategory: MonadicMap<Category, AsyncResult<Card>[]>,
  from: number,
  to: number
): AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>> {
  return current.mapOk((cardsByCategories) => {
    const newValue = new MonadicMap<Category, AsyncResult<Card>[]>(
      cardsByCategories
    )
    loadedCardsByCategory.forEach((cards, category) => {
      const existingCards = cardsByCategories.get(category)

      existingCards.map((existingCards) => {
        const cardsBefore = existingCards.slice(0, from)
        const cardsAfter = existingCards.slice(to)

        const newCards = [...cardsBefore, ...cards, ...cardsAfter]

        newValue.set(category, newCards)
      })
    })

    return newValue
  })
}

export class MonadicMap<Key, Value> implements Iterable<[Key, Value]> {
  private readonly pairs: Record<string, Value> = {}

  constructor(entries?: Iterable<[Key, Value]>) {
    if (!entries) {
      return
    }

    for (const [key, value] of entries) {
      this.pairs[JSON.stringify(key)] = value
    }
  }

  [Symbol.iterator](): Iterator<[Key, Value], any, undefined> {
    return Object.entries(this.pairs)
      .map(([key, value]) => [JSON.parse(key), value] as [Key, Value])
      [Symbol.iterator]()
  }

  public get(key: Key): Option<Value> {
    const maybeValue = this.pairs[JSON.stringify(key)]

    return maybeValue ? Option.Some(maybeValue) : Option.None()
  }

  public set(key: Key, value: Value) {
    this.pairs[JSON.stringify(key)] = value
  }

  public values(): Value[] {
    return Object.values(this.pairs)
  }

  public forEach(callback: (value: Value, key: Key) => void) {
    Object.entries(this.pairs).forEach(([key, value]) => {
      callback(value, JSON.parse(key))
    })
  }

  public map<T>(callback: (value: Value, key: Key) => T): T[] {
    return Object.entries(this.pairs).map(([key, value]) =>
      callback(value, JSON.parse(key))
    )
  }
}
