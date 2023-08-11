import { Future, Result } from '@swan-io/boxed'
import _ from 'lodash'
import groq from 'groq'

import {
  AsyncResult,
  MonadicMap,
  WithCardinality,
  ok,
} from '@scaredfinger/cards-by-cats-vm'

const END_POINT =
  'https://s8agvf93.apicdn.sanity.io/v2021-10-21/data/query/marketplace'

interface TripCollectionDto {
  id: string
  name: string
  count: number
}

export interface TripCollection {
  id: string
  name: string
}

export interface Trip {
  id: string
  headline: string
  salesPitch: any
  images: string[]
}

interface CategoryWithTripsDto {
  id: string
  name: string
  trips: Trip[]
}

type CategoryWithCardinality = WithCardinality<TripCollection>

export async function loadCategoriesAsync(): Promise<
  CategoryWithCardinality[]
> {
  const query = groq`*[
      _type == 'tripsCollection'
    ] {
      'id': _id,
      'name': nameSv,
      'count': length(trips)
    }`

  const response = await fetch(
    `${END_POINT}?query=${encodeURIComponent(query)}`
  )

  if (!response.ok) {
    throw new Error('Failed to load categories')
  }

  const json = await response.json()
  const categories = json.result as TripCollectionDto[]
  const categoriesWithCardinality: CategoryWithCardinality[] = categories.map(
    (c) => [
      {
        id: c.id,
        name: c.name,
      },
      c.count,
    ]
  )

  return categoriesWithCardinality
}

export function loadCategories(): Future<
  Result<CategoryWithCardinality[], Error>
> {
  return Future.fromPromise(loadCategoriesAsync()) as Future<
    Result<CategoryWithCardinality[], Error>
  >
}

export async function loadCardsByCategoryAsync(
  categories: TripCollection[],
  offset: number,
  limit: number) {
    const query = groq`*[
        _type == 'tripsCollection'
        && _id in $categories
      ] {
        'id': _id, 
        'name': nameSv,
        'trips': trips[$from..$to] {
          'id': @->_id,
          'headline': @->contentSv->headline,
          'salesPitch': @->contentSv->salesPitch,
            
          'images': @->images[]->image.asset->url
        }
      }`

    const encodedQuery = encodeURIComponent(query)
  
    const from = offset
    const encodedFrom = encodeURIComponent(from)
  
    const to = offset + limit - 1
    const encodedTo = encodeURIComponent(to)
  
    const categoryIds = categories.map((c) => c.id)
    const encodedCategories = encodeURIComponent(JSON.stringify(categoryIds))
  
    const url = `${END_POINT}?query=${encodedQuery}&%24categories=${encodedCategories}&%24from=${encodedFrom}&%24to=${encodedTo}`
  
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to load cards')
    }

    const json = await response.json()
    const cards = json.result as CategoryWithTripsDto[]

    const pairs: [TripCollection, Trip[]][] = cards.map(
      (c) =>
        [
          {
            id: c.id,
            name: c.name,
          },
          c.trips,
        ]
    )

    return new MonadicMap<TripCollection, Trip[]>(pairs)
}

export function loadCardsByCategory(
  categories: TripCollection[],
  offset: number,
  limit: number
): Future<Result<MonadicMap<TripCollection, AsyncResult<Trip>[]>, Error>> {
  const fetchPromise = loadCardsByCategoryAsync(categories, offset, limit)
    .then(response => new MonadicMap<TripCollection, AsyncResult<Trip>[]>(
      response.map<[TripCollection, AsyncResult<Trip>[]]>(
        (value, key) => [
          key, 
          value.map(v => ok(v))
        ]),
    ))

  return Future.fromPromise(fetchPromise) as Future<
    Result<MonadicMap<TripCollection, AsyncResult<Trip>[]>, Error>
  >
}
