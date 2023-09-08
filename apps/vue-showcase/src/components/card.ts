import { AsyncResult } from "@scaredfinger/cards-by-cats-vm"

import { Trip } from "../api/trips-and-collections"
import { h } from "vue"

interface WtihStyles {
  styles: { [key: string]: string }
}

interface Props extends WtihStyles {
  card: AsyncResult<Trip>
}

export const Card = ({ card, styles }: Props) => {

  /**
  <div className={`${styles.card} ${styles.done}`}>
    <h3>{card.headline}</h3>
    <PortableText value={card.salesPitch} />
    <div className={styles.cardImageList}>
      {card.images.map((image, i) => (
        <img key={i} src={image} className={styles.cardImage} />
      ))}
    </div>
  </div>
   * 
   */

  return card.match({
    Done: (done) => done.match({
      Ok: (okCard) => h('div', [
        h('h3', {}, okCard.headline),
        h('div', {}, okCard.salesPitch),
        h('div', {}, okCard.images.map((image, i) => h('img', {
          key: i,
          src: image
        })))
      ]),
      Error: (error) => renderError({ error })
    }),
    Loading: () => renderLoading({ styles }),
    NotAsked: () => renderNotAsked({ styles }),
  })
}

function renderNotAsked({ styles }: WtihStyles) {
  return h('div', {
    class: `${styles.card} ${styles.notAsked}`
  }, [])
}

function renderLoading({styles}: WtihStyles) {
  return h('div', {
    class: `${styles.card} ${styles.loading}`
  })
}

function renderError({ error }: { error: Error }) {
  return h('div', {}, [
    `Error: ${error.message}`
  ])
}