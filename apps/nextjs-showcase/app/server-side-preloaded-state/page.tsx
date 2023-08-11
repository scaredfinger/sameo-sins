import {
  AsyncResult,
  CardsByCategoriesWithProgressiveLoading,
  State,
  SubmitChangesFunc,
  WithCardinality,
} from '@scaredfinger/cards-by-cats-vm';

import { Trip } from '../with-actual-data/api';
import { AsyncData, Result } from '@swan-io/boxed';
import { loadCategories, loadCardsByCategory } from '../with-actual-data/api';

import styles from './page.module.scss';

/* eslint-disable-next-line */
export interface ServerSidePreloadedStateProps {}

export function ServerSidePreloadedState(props: ServerSidePreloadedStateProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to ServerSidePreloadedState!</h1>
    </div>
  );
}

export default ServerSidePreloadedState;

// class ServerSideState implements State<Trip, string> {
//   private _categories: AsyncData<Result<WithCardinality<string>[], Error>> =
//     AsyncData.NotAsked();
//   get categories(): AsyncData<Result<WithCardinality<string>[], Error>> {
//     return this._categories;
//   }
//   submitCategoryChanges(
//     applyChanges: SubmitChangesFunc<
//       AsyncData<Result<WithCardinality<string>[], Error>>
//     >
//   ): void {
//     this._categories = applyChanges(this._categories);
//   }
//   private _cardsByCategory: AsyncResult<Map<string, AsyncResult<Trip>[]>> =
//     AsyncData.NotAsked();
//   get cardsByCategory(): AsyncResult<Map<string, AsyncResult<Trip>[]>> {
//     return this._cardsByCategory;
//   }
//   submitCardsByCategoryChanges(
//     applyChanges: SubmitChangesFunc<
//       AsyncResult<Map<string, AsyncResult<Trip>[]>>
//     >
//   ): void {
//     this._cardsByCategory = applyChanges(this._cardsByCategory);
//   }
// }

// export async function getStaticProps() {
//   const state = new ServerSideState();
//   const viewModel = new CardsByCategoriesWithProgressiveLoading<Trip, string>(
//     state,
//     loadCategories,
//     loadCardsByCategory,
//     {
//       numberOfCategoriesToPreload: 2,
//       numberOfCardsToPreload: 4,
//       numberOfLoadMoreCards: 2,
//       numberOfLoadMoreCategories: 1,
//     }
//   );

//   viewModel.preload();

//   return {
//     props: {
//       preloadedState: {},
//     },
//   };
// }
