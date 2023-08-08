import { Future, Result } from '@swan-io/boxed';
import _ from 'lodash';
import groq from 'groq';

import {
  AsyncResult,
  WithCardinality,
  ok,
} from '@scaredfinger/cards-by-cats-vm';

interface TripCollectionDto {
  id: string;
  name: string;
  count: number;
}

export interface TripCollection {
  id: string;
  name: string;
}

export interface Trip {
  id: string;
  headline: string;
  salesPitch: string;
  images: string[];
}

interface CategoryWithTrips {
  id: string;
  name: string;
  trips: Trip[];
}

type CategoryWithCardinality = WithCardinality<TripCollection>;

export function loadCategories(): Future<
  Result<CategoryWithCardinality[], Error>
> {
  async function fetchAsync() {
    const query = groq`*[
        _type == 'tripCollection'
      ] {
        'id': _id,
        name,
        'count': length(trips)
      }`;

    const response = await fetch(
        `https://s8agvf93.apicdn.sanity.io/v2021-10-21/data/query/production?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to load categories');
    }

    const json = await response.json();
    const categories = json.result as TripCollectionDto[];
    const categoriesWithCardinality: CategoryWithCardinality[] = categories.map(
      (c) => [{
        id: c.id,
        name: c.name,
      }, c.count]
    );

    return categoriesWithCardinality;
  }

  return Future.fromPromise(fetchAsync()) as Future<
    Result<CategoryWithCardinality[], Error>
  >;
}

export function loadCardsByCategory(
  categories: TripCollection[],
  offset: number,
  limit: number
): Future<Result<Map<TripCollection, AsyncResult<Trip>[]>, Error>> {
    const query = groq`*[
      _type == 'tripCollection'
      && _id in $categories
    ] {
      'id': _id, 
      name,
      'trips': trips[$from..$to] {
        'id': @->_id,
        'headline': @->contentSwedish->headline,
        'salesPitch': @->contentSwedish->salesPitch,
        'images': @->images[]->image.asset->url
      }
    }`;
  const encodedQuery = encodeURIComponent(query);

  const from = offset;
  const encodedFrom = encodeURIComponent(from);

  const to = offset + limit - 1;
  const encodedTo = encodeURIComponent(to);

  const categoryIds = categories.map((c) => c.id);
  const encodedCategories = encodeURIComponent(JSON.stringify(categoryIds));

  const url = `https://s8agvf93.apicdn.sanity.io/v2021-10-21/data/query/production?query=${encodedQuery}&%24categories=${encodedCategories}&%24from=${encodedFrom}&%24to=${encodedTo}`;

  async function fetchAsync() {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to load cards');
    }

    const json = await response.json();
    const cards = json.result as CategoryWithTrips[];

    const pairs = cards.map((c) => [{
        id: c.id,
        name: c.name,
    }, c.trips.map((t) => ok(t))] as const);

    const result = new Map(pairs);
    return result;
  }

  const fetchPromise = fetchAsync();

  return Future.fromPromise(fetchPromise) as Future<
    Result<Map<TripCollection, AsyncResult<Trip>[]>, Error>
  >;
}
