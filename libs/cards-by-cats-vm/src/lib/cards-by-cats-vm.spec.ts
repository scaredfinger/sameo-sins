/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AsyncData, Future, Result } from '@swan-io/boxed'
import { randomInt } from 'crypto'
import _ from 'lodash'

import { PendingTasks, Signal } from './tests-helpers'

import {
  CardsByCategoriesWithProgressiveLoading,
  AsyncResult,
  WithCardinality,
  ok,
  State,
  SubmitChangesFunc,
  MonadicMap,
} from './cards-by-cats-vm'

describe('class `CardsByCategoriesWithProgressiveLoading<Card,Category>`', () => {
  let pendingTasks: PendingTasks
  let pendingLoadCategories: PendingTasks
  let pendingLoadCards: PendingTasks
  let pendingLoadCardsCalls: MonadicMap<string, PendingTasks>

  let loadingCategories: Signal
  let loadingCards: MonadicMap<string, Signal>

  let sut: CardsByCategoriesWithProgressiveLoading<Card, Category>

  beforeEach(() => {
    pendingTasks = new PendingTasks()
    pendingLoadCategories = new PendingTasks()
    pendingLoadCards = new PendingTasks()
    pendingLoadCardsCalls = new MonadicMap<string, PendingTasks>()

    loadingCategories = new Signal()
    loadingCards = new MonadicMap<string, Signal>()

    sut = new CardsByCategoriesWithProgressiveLoading<Card, Category>(
      new TestState(),
      loadCategories,
      loadCardsByCategory,
      {
        numberOfCategoriesToPreload: NUMBER_OF_CATEGORIES_TO_PRELOAD,
        numberOfCardsToPreload: NUMBER_OF_CARDS_TO_PRELOAD,
        numberOfLoadMoreCategories: NUMBER_OF_LOAD_MORE_CATEGORIES,
        numberOfLoadMoreCards: NUMBER_OF_LOAD_MORE_CARDS,
      }
    )
  })

  describe('test data integrity', () => {
    it('has un event number of categories relative to preload and load more numbers', () => {
      const actual =
        (ALL_CATEGORIES.length - NUMBER_OF_CATEGORIES_TO_PRELOAD) %
        NUMBER_OF_LOAD_MORE_CATEGORIES
      expect(actual).not.toBe(0)
    })
  })

  describe('default options', () => {
    it('can be created with default values', () => {
      const instance = new CardsByCategoriesWithProgressiveLoading<Card, Category>(
        new TestState(),
        loadCategories,
        loadCardsByCategory
      )
    })
  })

  it('can be created', () => {
    expect(sut).toBeTruthy()
  })

  describe('before preload', () => {
    it('returns not asked for categories', () => {
      expect(sut.categories.isNotAsked()).toBeTruthy()
    })

    it('returns not asked for cards', () => {
      expect(sut.cardsByCategory.isNotAsked()).toBeTruthy()
    })
  })

  describe('on preload', () => {
    beforeEach(() => {
      sut.preload()
    })

    it('returns loading categories', () => {
      expect(sut.categories.isLoading()).toBeTruthy()
    })

    describe('on load categories done', () => {
      beforeEach(async () => {
        loadingCategories.signal()
        await untilNoMorePendingLoadCategories()
      })

      it('returns done categories', async () => {
        sut.categories.match({
          Done: (categoriesOrError) => {
            categoriesOrError.match({
              Ok: (categories) => {
                expect(categories).toEqual(ALL_CATEGORIES)
              },
              Error: () => {
                fail('should not be error')
              },
            })
          },
          Loading: () => {
            fail('should not be loading')
          },
          NotAsked: () => {
            fail('should not be not asked')
          },
        })
      })

      it('returns preload cards in preload categories as loading', async () => {
        const preloadedCategories = getPreloadedCategories()

        preloadedCategories.forEach((cardsByCategory) => {
          onCategoryCards(cardsByCategory, (cards) => {
            const preloadCards = getPreloadCards(cards)
            expect(preloadCards.every((card) => card.isLoading())).toBeTruthy()
          })
        })
      })

      it('returns preload categories non preload cards as not asked', async () => {
        const preloadedCategories = getPreloadedCategories()

        preloadedCategories.forEach((cardsByCategory) => {
          onCategoryCards(cardsByCategory, (cards) => {
            const nonPreloadCards = getNonPreloadCards(cards)
            expect(
              nonPreloadCards.every((card) => card.isNotAsked())
            ).toBeTruthy()
          })
        })
      })

      it('returns non preload categories cards as not asked', async () => {
        const nonPreloadedCategories = getNonPreloadedCategories()

        nonPreloadedCategories.forEach((cardsByCategory) => {
          onCategoryCards(cardsByCategory, (cards) => {
            expect(cards.every((card) => card.isNotAsked())).toBeTruthy()
          })
        })
      })
    })

    describe('on load categories error', () => {
      beforeEach(async () => {
        loadingCategories.signalError()
        await untilNoMorePendingLoadCategories()
      })

      it('returns done', () => {
        expect(sut.categories.isDone()).toBeTruthy()
      })

      it('returns done as error', () => {
        sut.categories.map((categoriesOrError) => {
          categoriesOrError.match({
            Ok: () => expect(false).toBeTruthy(),
            Error: (error) => expect(error).toBeTruthy(),
          })
        })
      })

      it('returns done as error for cards', () => {
        sut.cardsByCategory.map((cardsByCategoryOrError) => {
          cardsByCategoryOrError.match({
            Ok: () => expect(false).toBeTruthy(),
            Error: (error) => expect(error).toBeTruthy(),
          })
        })
      })
    })

    describe('on load cards by category done', () => {
      beforeEach(async () => {
        loadingCategories.signal()
        await untilNoMorePendingTasks()

        signalLoadCards(
          PRELOADED_CATEGORIES_NAMES,
          0,
          NUMBER_OF_CARDS_TO_PRELOAD
        )

        await untilNoMorePendingTasks()
      })

      it('returns cards from preload categories as done', async () => {
        const preloadedCategories = getPreloadedCategories()

        preloadedCategories.forEach((cardsByCategory, categoryIndex) => {
          cardsByCategory.match({
            Done: (cardsByCategoryOrError) => {
              cardsByCategoryOrError.match({
                Ok: (cardsByCategory) => {
                  const doneCards = getPreloadCards(cardsByCategory)
                  doneCards.forEach((card, cardIndex) => {
                    card.match({
                      Done: (cardOrError) => {
                        cardOrError.match({
                          Ok: (card) => {
                            const expectedCard = getCard(
                              categoryIndex,
                              cardIndex
                            )
                            expect(card).toEqual(expectedCard)
                          },
                          Error: () => {
                            fail('should not be error')
                          },
                        })
                      },
                      Loading: () => {
                        fail('should not be loading')
                      },
                      NotAsked: () => {
                        fail('should not be not asked')
                      },
                    })
                  })
                },
                Error: () => {
                  fail('should not be error')
                },
              })
            },
            Loading: () => {
              fail('should not be loading')
            },
            NotAsked: () => {
              fail('should not be not asked')
            },
          })
        })
      })

      it('keeps the number of cards in preload categories', async () => {
        const preloadedCategories = getPreloadedCategories()

        preloadedCategories.forEach((cardsByCategory, categoryIndex) => {
          cardsByCategory.match({
            Done: (cardsByCategoryOrError) => {
              cardsByCategoryOrError.match({
                Ok: (cardsByCategory) => {
                  const [, expectedLength] =
                    getCategoryWithCardinality(categoryIndex)
                  expect(cardsByCategory.length).toEqual(expectedLength)
                },
                Error: () => {
                  fail('should not be error')
                },
              })
            },
            Loading: () => {
              fail('should not be loading')
            },
            NotAsked: () => {
              fail('should not be not asked')
            },
          })
        })
      })
    })
  })

  describe('on load more categories', () => {
    beforeEach(async () => {
      sut.preload()
      loadingCategories.signal()
      await untilNoMorePendingLoadCategories()

      signalLoadCards(PRELOADED_CATEGORIES_NAMES, 0, NUMBER_OF_CARDS_TO_PRELOAD)
      await untilNoMorePendingTasks()

      sut.loadMoreCategories()
    })

    describe('on load cards by category not done', () => {
      it('returns loading for cards in next categories', async () => {
        const nextCategories = getFirstBatchOfNonPreloadedCategories()

        nextCategories.forEach((cardsByCategory) => {
          onCategoryCards(cardsByCategory, (cardsByCategory) => {
            expect(
              cardsByCategory
                .slice(0, NUMBER_OF_CARDS_TO_PRELOAD)
                .every((card) => card.isLoading())
            ).toBeTruthy()
          })
        })
      })

      it('returns not asked for cards beyond preloaded cards', async () => {
        const nextCategories =
          FIRST_BATCH_OF_NON_PRELOADED_CATEGORIES_NAMES.map((category) =>
            sut.cardsByCategory.mapOk((cardsByCategory) =>
              cardsByCategory.get(category).match({
                Some: (cardsByCategory) => cardsByCategory,
                None: () => {
                  fail('should not be none')
                  return []
                }
              })
            )
          )

        nextCategories.forEach((cardsByCategory) => {
          cardsByCategory.match({
            Done: (cardsByCategoryOrError) => {
              cardsByCategoryOrError.match({
                Ok: (cardsByCategory) => {
                  expect(
                    cardsByCategory
                      ?.slice(NUMBER_OF_CARDS_TO_PRELOAD)
                      .every((card) => card.isNotAsked())
                  ).toBeTruthy()
                },
                Error: () => {
                  fail('should not be error')
                },
              })
            },
            Loading: () => {
              fail('should not be loading')
            },
            NotAsked: () => {
              fail('should not be not asked')
            },
          })
        })
      })
    })

    describe('on load cards by category done', () => {
      beforeEach(async () => {
        signalLoadCards(
          FIRST_BATCH_OF_NON_PRELOADED_CATEGORIES_NAMES,
          0,
          NUMBER_OF_CARDS_TO_PRELOAD
        )
        await untilNoMorePendingTasks()
      })

      it('returns done for cards in next categories', async () => {
        const nextCategories = getFirstBatchOfNonPreloadedCategories()

        nextCategories.forEach((cardsByCategory) => {
          cardsByCategory.match({
            Done: (cardsByCategoryOrError) => {
              cardsByCategoryOrError.match({
                Ok: (cardsByCategory) => {
                  const preloadCards = getPreloadCards(cardsByCategory)
                  expect(
                    preloadCards.every((card) => card.isDone())
                  ).toBeTruthy()
                },
                Error: () => {
                  fail('should not be error')
                },
              })
            },
            Loading: () => {
              fail('should not be loading')
            },
            NotAsked: () => {
              fail('should not be not asked')
            },
          })
        })
      })

      it('returns not asked for cards beyond preloaded cards', async () => {
        const nextCategories = getFirstBatchOfNonPreloadedCategories()

        nextCategories.forEach((cardsByCategory) => {
          cardsByCategory.match({
            Done: (cardsByCategoryOrError) => {
              cardsByCategoryOrError.match({
                Ok: (cardsByCategory) => {
                  const nonPreloadCards = getNonPreloadCards(cardsByCategory)
                  expect(
                    nonPreloadCards.every((card) => card.isNotAsked())
                  ).toBeTruthy()
                },
                Error: () => {
                  fail('should not be error')
                },
              })
            },
            Loading: () => {
              fail('should not be loading')
            },
            NotAsked: () => {
              fail('should not be not asked')
            },
          })
        })
      })
    })
  })

  describe('on load more cards', () => {
    beforeEach(async () => {
      sut.preload()
      loadingCategories.signal()
      await untilNoMorePendingLoadCategories()

      signalLoadCards(PRELOADED_CATEGORIES_NAMES, 0, NUMBER_OF_CARDS_TO_PRELOAD)
      await untilNoMorePendingTasks()

      sut.loadMoreCards(PRELOADED_CATEGORIES_NAMES[0])
    })

    describe('on load cards by category not done', () => {
      it('returns loading for load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const loadMoreCards = getFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(loadMoreCards.every((card) => card.isLoading())).toBeTruthy()
        })
      })

      it('returns not asked for cards beyond loading ones', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const loadMoreCards =
            getRestOfCardsBeyondFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(loadMoreCards.every((card) => card.isNotAsked())).toBeTruthy()
        })
      })

      it('keeps same number of cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const numberOfCardsInCategory = getCategoryWithCardinality(0)[1]
          expect(cardsByCategory.length).toBe(numberOfCardsInCategory)
        })
      })
    })

    describe('on load cards by category done', () => {
      beforeEach(async () => {
        const firstCategory = PRELOADED_CATEGORIES_NAMES[0]
        signalLoadCards(
          [firstCategory],
          NUMBER_OF_CARDS_TO_PRELOAD,
          NUMBER_OF_LOAD_MORE_CARDS
        )
        await untilNoMorePendingTasks()
      })

      it('returns done for load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const loadMoreCards = getFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(loadMoreCards.every((card) => card.isDone())).toBeTruthy()
        })
      })

      it('returns not asked for cards beyond done ones', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const loadMoreCards =
            getRestOfCardsBeyondFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(loadMoreCards.every((card) => card.isNotAsked())).toBeTruthy()
        })
      })
    })
  })

  describe('on load even more cards', () => {
    beforeEach(async () => {
      sut.preload()
      signalLoadCategories()
      await untilNoMorePendingLoadCategories()

      signalLoadCards(PRELOADED_CATEGORIES_NAMES, 0, NUMBER_OF_CARDS_TO_PRELOAD)
      await untilNoMorePendingTasks()

      sut.loadMoreCards(FIRST_PRELOAD_CATEGORY_NAME)
    })

    describe('on first load cards by category done', () => {
      beforeEach(async () => {
        signalLoadCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD,
          NUMBER_OF_LOAD_MORE_CARDS
        )
        await untilNoMorePendingTasks()

        sut.loadMoreCards(PRELOADED_CATEGORIES_NAMES[0])
      })

      describe('on second load cards by category not done', () => {
        it('returns loading for load more cards', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const sencondBatch = getSencondBatchOfLoadMoreCards(cardsByCategory)
            expect(sencondBatch.every((card) => card.isLoading())).toBeTruthy()
          })
        })

        it('still returns done for first load more cards', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const firstBatch = getFirstBatchOfLoadMoreCards(cardsByCategory)
            expect(firstBatch.every((card) => card.isDone())).toBeTruthy()
          })
        })

        it('returns not asked for cards beyond loading ones', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const loadMoreCards =
              getRestOfCardsBeyondSecondBatchOfLoadMoreCards(cardsByCategory)
            expect(
              loadMoreCards.every((card) => card.isNotAsked())
            ).toBeTruthy()
          })
        })

        it('keep same number of cards', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const numberOfCardsInCategory = getCategoryWithCardinality(0)[1]
            expect(cardsByCategory.length).toBe(numberOfCardsInCategory)
          })
        })
      })

      describe('on second load cards by category done', () => {
        beforeEach(async () => {
          signalLoadCards(
            [FIRST_PRELOAD_CATEGORY_NAME],
            NUMBER_OF_CARDS_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CARDS,
            NUMBER_OF_LOAD_MORE_CARDS
          )
          await untilNoMorePendingTasks()
        })

        it('returns done for second load more cards', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const secondBatch = getSencondBatchOfLoadMoreCards(cardsByCategory)
            expect(secondBatch.every((card) => card.isDone())).toBeTruthy()
          })
        })
      })
    })

    describe('on first load cards by category not done', () => {
      describe('on second load cards by category not done', () => {
        beforeEach(async () => {
          sut.loadMoreCards(PRELOADED_CATEGORIES_NAMES[0])
        })

        it('returns loading for first batch of load more cards', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const sencondBatch = getFirstBatchOfLoadMoreCards(cardsByCategory)
            expect(sencondBatch.every((card) => card.isLoading())).toBeTruthy()
          })
        })

        it('returns loading for second batch of load more cards', async () => {
          const category = getPreloadedCategories()[0]

          onCategoryCards(category, (cardsByCategory) => {
            const sencondBatch = getSencondBatchOfLoadMoreCards(cardsByCategory)
            expect(sencondBatch.every((card) => card.isLoading())).toBeTruthy()
          })
        })
      })
    })
  })

  describe('loading more cards twice', () => {
    beforeEach(async () => {
      sut.preload()
      signalLoadCategories()
      await untilNoMorePendingLoadCategories()

      signalLoadCards(PRELOADED_CATEGORIES_NAMES, 0, NUMBER_OF_CARDS_TO_PRELOAD)
      await untilNoMorePendingLoadCards()

      sut.loadMoreCards(FIRST_PRELOAD_CATEGORY_NAME)
      sut.loadMoreCards(FIRST_PRELOAD_CATEGORY_NAME)
    })

    describe('on none has finished', () => {
      it('returns loading for first batch of load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const sencondBatch = getFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(sencondBatch.every((card) => card.isLoading())).toBeTruthy()
        })
      })

      it('returns loading for second batch of load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const sencondBatch = getSencondBatchOfLoadMoreCards(cardsByCategory)
          expect(sencondBatch.every((card) => card.isLoading())).toBeTruthy()
        })
      })

      it('returns not asked for cards beyond loading ones', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const loadMoreCards =
            getRestOfCardsBeyondSecondBatchOfLoadMoreCards(cardsByCategory)
          expect(loadMoreCards.every((card) => card.isNotAsked())).toBeTruthy()
        })
      })
    })

    describe('on first has finished', () => {
      beforeEach(async () => {
        signalLoadCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD,
          NUMBER_OF_LOAD_MORE_CARDS
        )
        await untilDoneLoadingCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD,
          NUMBER_OF_LOAD_MORE_CARDS
        )
      })

      it('returns done for first batch of load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const sencondBatch = getFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(sencondBatch.every((card) => card.isDone())).toBeTruthy()
        })
      })

      it('returns loading for second batch of load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const sencondBatch = getSencondBatchOfLoadMoreCards(cardsByCategory)
          expect(sencondBatch.every((card) => card.isLoading())).toBeTruthy()
        })
      })
    })

    describe('on second has finished too', () => {
      beforeEach(async () => {
        signalLoadCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD,
          NUMBER_OF_LOAD_MORE_CARDS
        )
        await untilDoneLoadingCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD,
          NUMBER_OF_LOAD_MORE_CARDS
        )

        signalLoadCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CARDS,
          NUMBER_OF_LOAD_MORE_CARDS
        )
        await untilDoneLoadingCards(
          [FIRST_PRELOAD_CATEGORY_NAME],
          NUMBER_OF_CARDS_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CARDS,
          NUMBER_OF_LOAD_MORE_CARDS
        )
      })

      it('returns done for first batch of load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const sencondBatch = getFirstBatchOfLoadMoreCards(cardsByCategory)
          expect(sencondBatch.every((card) => card.isDone())).toBeTruthy()
        })
      })

      it('returns done for second batch of load more cards', async () => {
        const category = getPreloadedCategories()[0]

        onCategoryCards(category, (cardsByCategory) => {
          const sencondBatch = getSencondBatchOfLoadMoreCards(cardsByCategory)
          expect(sencondBatch.every((card) => card.isDone())).toBeTruthy()
        })
      })
    })
  })

  describe('loading more categories when there are no more categories to load', () => {
    beforeEach(async () => {
      sut.preload()
      signalLoadCategories()
      await untilNoMorePendingLoadCategories()

      signalLoadCards(PRELOADED_CATEGORIES_NAMES, 0, NUMBER_OF_CARDS_TO_PRELOAD)
      await untilNoMorePendingLoadCards()

      await untilNoMorePendingTasks()

      for (let i = 0; i < TIMES_TO_REACH_LAST_CATEGORY_BLOCK; i++) {
        sut.loadMoreCategories()
        const categoriesNames = getIthBatchOfNonPreloadedCategoriesNames(i)
        signalLoadCards(categoriesNames, 0, NUMBER_OF_CARDS_TO_PRELOAD)
        await untilNoMorePendingLoadCards()
      }

      await untilNoMorePendingTasks()
    })

    describe('loading more categories', () => {
      beforeEach(async () => {
        sut.loadMoreCategories()
      })

      it('asks only remaining categories', async () => {
        const lastBatchOfNonPreloadedCategoriesNames =
          getIthBatchOfNonPreloadedCategoriesNames(
            TIMES_TO_REACH_LAST_CATEGORY_BLOCK
          )
        signalLoadCards(
          lastBatchOfNonPreloadedCategoriesNames,
          0,
          NUMBER_OF_CARDS_TO_PRELOAD
        )
        await untilNoMorePendingTasks()
      })
    })

    describe('loading event more categories', () => {
      beforeEach(async () => {
        sut.loadMoreCategories()
        const lastBatchOfNonPreloadedCategoriesNames =
          getIthBatchOfNonPreloadedCategoriesNames(
            TIMES_TO_REACH_LAST_CATEGORY_BLOCK
          )
        signalLoadCards(
          lastBatchOfNonPreloadedCategoriesNames,
          0,
          NUMBER_OF_CARDS_TO_PRELOAD
        )
        await untilNoMorePendingTasks()
      })

      it('does nothing', async () => {
        sut.loadMoreCategories()

        await untilNoMorePendingTasks()
      })
    })
  })

  describe('loading more cards when there are no nore cards to load', () => {
    let firstCategoryName: Category
    let numberOfCardsInFirstCategory: number
    let numberOfTimesToReachLastBatchOfCards: number

    beforeEach(async () => {
      ;[firstCategoryName, numberOfCardsInFirstCategory] = ALL_CATEGORIES[0]
      numberOfTimesToReachLastBatchOfCards = Math.floor(
        (numberOfCardsInFirstCategory - NUMBER_OF_CARDS_TO_PRELOAD) /
          NUMBER_OF_LOAD_MORE_CARDS
      )

      sut.preload()
      signalLoadCategories()
      await untilNoMorePendingLoadCategories()

      signalLoadCards(PRELOADED_CATEGORIES_NAMES, 0, NUMBER_OF_CARDS_TO_PRELOAD)
      await untilNoMorePendingLoadCards()

      for (let i = 0; i < numberOfTimesToReachLastBatchOfCards; i++) {
        sut.loadMoreCards(firstCategoryName)
        signalLoadCards(
          [firstCategoryName],
          NUMBER_OF_CARDS_TO_PRELOAD + i * NUMBER_OF_LOAD_MORE_CARDS,
          NUMBER_OF_LOAD_MORE_CARDS
        )
        await untilNoMorePendingLoadCards()
      }
    })

    describe('loading more cards', () => {
      beforeEach(() => {
        sut.loadMoreCards(firstCategoryName)
      })

      it('requests only remaining cards', async () => {
        const offset =
          NUMBER_OF_CARDS_TO_PRELOAD +
          numberOfTimesToReachLastBatchOfCards * NUMBER_OF_LOAD_MORE_CARDS
        const limit =
          numberOfCardsInFirstCategory -
          NUMBER_OF_CARDS_TO_PRELOAD -
          numberOfTimesToReachLastBatchOfCards * NUMBER_OF_LOAD_MORE_CARDS
        signalLoadCards([firstCategoryName], offset, limit)
        await untilNoMorePendingLoadCards()
      })
    })

    describe('loading even more cards', () => {
      beforeEach(async () => {
        sut.loadMoreCards(firstCategoryName)

        const offset =
          NUMBER_OF_CARDS_TO_PRELOAD +
          numberOfTimesToReachLastBatchOfCards * NUMBER_OF_LOAD_MORE_CARDS
        const limit =
          numberOfCardsInFirstCategory -
          NUMBER_OF_CARDS_TO_PRELOAD -
          numberOfTimesToReachLastBatchOfCards * NUMBER_OF_LOAD_MORE_CARDS
        signalLoadCards([firstCategoryName], offset, limit)

        await untilNoMorePendingLoadCards()
        await untilNoMorePendingTasks()
      })

      it('works', () => {
        expect(1).toBe(1)
      })

      it('does nothing', async () => {
        sut.loadMoreCards(firstCategoryName)

        await untilNoMorePendingTasks()
      })
    })
  })

  describe('load more cards from non existing category', () => {
    it('does nothing', async () => {
      sut.loadMoreCards(NON_EXISTING_CATEGORY)

      await untilNoMorePendingTasks()
    })
  })

  describe('edge cases', () => {

    describe('when then number of cards in a cat is less than the preload number of cards', () => {

      beforeEach(async () => {
        sut = new CardsByCategoriesWithProgressiveLoading<Card, Category>(
          new TestState(),
          loadCategories,
          loadCardsByCategory,
          {
            numberOfCategoriesToPreload: NUMBER_OF_CATEGORIES_TO_PRELOAD,
            numberOfCardsToPreload: NUMBER_OF_CARDS_TO_PRELOAD * 1_000_000,
            numberOfLoadMoreCategories: NUMBER_OF_LOAD_MORE_CATEGORIES,
            numberOfLoadMoreCards: NUMBER_OF_LOAD_MORE_CARDS,
          }
        )

        sut.preload()
        signalLoadCategories()
      })

      it('returns done for cards in preload categories', async () => {
        expect(sut.cardsByCategory.isDone()).toBeTruthy()
      })

    })

  })

  async function untilNoMorePendingTasks(): Promise<void> {
    await Promise.all([
      pendingTasks.untilAllDone(),
      pendingLoadCategories.untilAllDone(),
      pendingLoadCards.untilAllDone(),
    ])

    pendingTasks.clear()
    pendingLoadCategories.clear()
    pendingLoadCards.clear()
  }

  async function untilNoMorePendingLoadCategories(): Promise<void> {
    await pendingLoadCategories.untilAllDone()

    pendingLoadCategories.clear()
  }

  async function untilNoMorePendingLoadCards(): Promise<void> {
    await pendingLoadCards.untilAllDone()

    pendingLoadCards.clear()
  }

  function onCategoryCards(
    category: AsyncData<Result<AsyncResult<Card>[], Error>>,
    assertion: (cards: AsyncResult<Card>[]) => void
  ) {
    category.match({
      Done: (cardsByCategoryOrError) => {
        cardsByCategoryOrError.match({
          Ok: (categoryCards) => {
            assertion(categoryCards)
          },
          Error: () => {
            fail('should not be error')
          },
        })
      },
      Loading: () => fail('should not be loading'),
      NotAsked: () => fail('should not be not asked'),
    })
  }

  function loadCategories(): Future<
    Result<WithCardinality<Category>[], Error>
  > {
    async function loadCategoryAsPromise(): Promise<
      WithCardinality<Category>[]
    > {
      await loadingCategories.untilSignaled()
      return ALL_CATEGORIES
    }

    const promise = loadCategoryAsPromise()
    pendingLoadCategories.add(promise)
    pendingTasks.add(promise)

    return Future.fromPromise(promise) as Future<
      Result<WithCardinality<Category>[], Error>
    >
  }

  function renderLoadCardsKey(
    categories: Category[],
    offset: number,
    limit: number
  ) {
    return `loadCategoryCards(${JSON.stringify(
      categories
    )}, ${offset}, ${limit})`
  }

  function untilSignaledLoadingCards(
    categories: Category[],
    offset: number,
    limit: number
  ) {
    const key = renderLoadCardsKey(categories, offset, limit)
    const signal = loadingCards.get(key)
      .match({
        Some: (signal) => signal,
        None: () => {
          const newSignal = new Signal()
          loadingCards.set(key, newSignal)

          return newSignal
        },
      })

    return signal.untilSignaled()
  }

  function addPendingLoadCards(
    promise: Promise<unknown>,
    categories: Category[],
    offset: number,
    limit: number
  ) {
    pendingLoadCards.add(promise)
    pendingTasks.add(promise)
    
    const key = renderLoadCardsKey(categories, offset, limit)
    const callPendingTasks = pendingLoadCardsCalls.get(key).match({
      Some: (call) => call,
      None: () => {
        const newPendingTasks = new PendingTasks()
        pendingLoadCardsCalls.set(key, newPendingTasks)

        return newPendingTasks
      }
    })

    callPendingTasks.add(promise)
  }

  function untilDoneLoadingCards(
    categories: Category[],
    offset: number,
    limit: number
  ) {
    const key = renderLoadCardsKey(categories, offset, limit)
    const pendingTasks = pendingLoadCardsCalls.get(key)

    return pendingTasks.match({
      Some: (p) => p.untilAllDone(),
      None: () => NEVER_ENDING_PROMISE
    })
  }

  function signalLoadCards(
    categories: Category[],
    offset: number,
    limit: number
  ) {
    const key = renderLoadCardsKey(categories, offset, limit)
    const signal = loadingCards.get(key).match({
      Some: (signal) => signal,
      None: () => {
        const newSignal = new Signal()
        loadingCards.set(key, newSignal)

        return newSignal
      }
    })

    signal.signal()
  }

  function signalLoadCategories() {
    loadingCategories.signal()
  }

  function loadCardsByCategory(
    categories: Category[],
    offset: number,
    limit: number
  ): Future<Result<MonadicMap<Category, AsyncResult<Card>[]>, Error>> {
    async function loadCardsAsPromise(): Promise<
      MonadicMap<Category, AsyncResult<Card>[]>
    > {
      await untilSignaledLoadingCards(categories, offset, limit)

      const categoriesWithRequestedCards = ALL_CARDS_BY_CATEGORY.filter(
        ({ category }) => categories.includes(category)
      ).map<[Category, AsyncResult<Card>[]]>(({ category, cards }) => [
        category,
        cards.slice(offset, offset + limit).map((card) => ok(card)),
      ])

      return new MonadicMap<Category, AsyncResult<Card>[]>(
        categoriesWithRequestedCards
      )
    }

    const promise = loadCardsAsPromise()
    addPendingLoadCards(promise, categories, offset, limit)

    return Future.fromPromise(promise) as Future<
      Result<MonadicMap<Category, AsyncResult<Card>[]>, Error>
    >
  }

  function getPreloadedCategories() {
    return PRELOADED_CATEGORIES_NAMES.map((category) =>
      sut.cardsByCategory.mapOk((cardsByCategory) =>
        cardsByCategory.get(category).match({
          Some: (cardsByCategory) => cardsByCategory,
          // TODO: Fix this dirty hack
          None: () => { throw Error() }
        })
      )
    )
  }

  function getFirstBatchOfNonPreloadedCategories() {
    return getIthBatchOfNonPreloadedCategories(0)
  }

  function getIthBatchOfNonPreloadedCategoriesNames(i: number) {
    return ALL_CATEGORIES.slice(
      NUMBER_OF_CATEGORIES_TO_PRELOAD + i * NUMBER_OF_LOAD_MORE_CATEGORIES,
      NUMBER_OF_CATEGORIES_TO_PRELOAD + (i + 1) * NUMBER_OF_LOAD_MORE_CATEGORIES
    ).map(([name]) => name)
  }

  function getIthBatchOfNonPreloadedCategories(i: number) {
    return getIthBatchOfNonPreloadedCategoriesNames(i).map((category) =>
      sut.cardsByCategory.mapOk(
        (cardsByCategory) => cardsByCategory.get(category).match({
          Some: (cardsByCategory) => cardsByCategory,
          // TODO: Fix this dirty hack
          None: () => { throw Error() }
        })
      )
    )
  }

  function getPreloadCards(cardsByCategory: AsyncResult<Card>[]) {
    return cardsByCategory.slice(0, NUMBER_OF_CARDS_TO_PRELOAD)
  }

  function getNonPreloadCards(cardsByCategory: AsyncResult<Card>[]) {
    return cardsByCategory.slice(NUMBER_OF_CARDS_TO_PRELOAD)
  }

  function getNonPreloadedCategories() {
    return ALL_CATEGORIES.slice(NUMBER_OF_CATEGORIES_TO_PRELOAD).map(
      ([category]) =>
        sut.cardsByCategory.mapOk(
          (cardsByCategory) => cardsByCategory.get(category).match({
            Some: (cardsByCategory) => cardsByCategory,
            // TODO: Fix this dirty hack
            None: () => { throw Error() }
          })
        )
    )
  }

  function getCard(categoryIndex: number, cardIndex: number) {
    return ALL_CARDS_BY_CATEGORY[categoryIndex].cards[cardIndex]
  }

  function getCategoryWithCardinality(categoryIndex: number) {
    return ALL_CATEGORIES[categoryIndex]
  }

  function getFirstBatchOfLoadMoreCards(cardsByCategory: AsyncResult<Card>[]) {
    return cardsByCategory.slice(
      NUMBER_OF_CARDS_TO_PRELOAD,
      NUMBER_OF_CARDS_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CARDS
    )
  }

  function getRestOfCardsBeyondFirstBatchOfLoadMoreCards(
    cardsByCategory: AsyncResult<Card>[]
  ) {
    return cardsByCategory.slice(
      NUMBER_OF_CARDS_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CARDS
    )
  }

  function getRestOfCardsBeyondSecondBatchOfLoadMoreCards(
    cardsByCategory: AsyncResult<Card>[]
  ) {
    return cardsByCategory.slice(
      NUMBER_OF_CARDS_TO_PRELOAD + 2 * NUMBER_OF_LOAD_MORE_CARDS
    )
  }

  function getSencondBatchOfLoadMoreCards(
    cardsByCategory: AsyncResult<Card>[]
  ) {
    return cardsByCategory.slice(
      NUMBER_OF_CARDS_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CARDS,
      NUMBER_OF_CARDS_TO_PRELOAD + 2 * NUMBER_OF_LOAD_MORE_CARDS
    )
  }
})

interface Category {
  id: string
  name: string
}

class TestState implements State<Card, Category> {
  public categories: AsyncResult<CategoryWithCardinality[]> =
    AsyncData.NotAsked()
  submitCategoryChanges(
    applyChanges: SubmitChangesFunc<
      AsyncData<Result<WithCardinality<Category>[], Error>>
    >
  ): void {
    this.categories = applyChanges(this.categories)
  }
  public cardsByCategory: AsyncResult<
    MonadicMap<Category, AsyncResult<Card>[]>
  > = AsyncData.NotAsked()
  submitCardsByCategoryChanges(
    applyChanges: SubmitChangesFunc<
      AsyncResult<MonadicMap<Category, AsyncResult<Card>[]>>
    >
  ): void {
    this.cardsByCategory = applyChanges(this.cardsByCategory)
  }
  public numberOfCategoriesWithLoadedCards = 0
  submitNumberOfCategoriesWithLoadedCardsChanges(
    applyChanges: SubmitChangesFunc<number>
  ): void {
    this.numberOfCategoriesWithLoadedCards = applyChanges(
      this.numberOfCategoriesWithLoadedCards
    )
  }
}

interface Card {
  name: string
}

type CategoryWithCardinality = WithCardinality<Category>

interface CategoryWithCards {
  category: Category
  cards: Card[]
}

const NON_EXISTING_CATEGORY = {
  id: 'non-existing-category',
  name: 'non existing category',
}

const ALL_CATEGORIES: WithCardinality<Category>[] = Array(26)
  .fill(0)
  .map((_, i) => [
    {
      id: `category-${i}`,
      name: `category ${i}`,
    },
    randomInt(20, 50),
  ])

function cardName(category: Category, i: number): string {
  return `${category.id} - card - ${i}`
}

const ALL_CARDS_BY_CATEGORY: CategoryWithCards[] = ALL_CATEGORIES.map(
  ([category, count]) => ({
    category,
    cards: Array(count)
      .fill(1)
      .map((_, i) => ({ name: cardName(category, i) })),
  })
)

const NUMBER_OF_CATEGORIES_TO_PRELOAD = 3
const NUMBER_OF_CARDS_TO_PRELOAD = 10
const NUMBER_OF_LOAD_MORE_CATEGORIES = 2
const NUMBER_OF_LOAD_MORE_CARDS = 5

const PRELOADED_CATEGORIES_NAMES = ALL_CATEGORIES.slice(
  0,
  NUMBER_OF_CATEGORIES_TO_PRELOAD
).map(([name]) => name)
const FIRST_PRELOAD_CATEGORY_NAME = PRELOADED_CATEGORIES_NAMES[0]
const FIRST_BATCH_OF_NON_PRELOADED_CATEGORIES_NAMES = ALL_CATEGORIES.slice(
  NUMBER_OF_CATEGORIES_TO_PRELOAD,
  NUMBER_OF_CATEGORIES_TO_PRELOAD + NUMBER_OF_LOAD_MORE_CATEGORIES
).map(([name]) => name)

const TIMES_TO_REACH_LAST_CATEGORY_BLOCK = Math.floor(
  (ALL_CATEGORIES.length - NUMBER_OF_CATEGORIES_TO_PRELOAD) /
    NUMBER_OF_LOAD_MORE_CATEGORIES
)

const NEVER_ENDING_PROMISE = new Promise(_.noop)
